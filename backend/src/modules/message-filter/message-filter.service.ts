import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service.js';
import { RedisService } from '../../shared/redis/redis.service.js';
import { DISPATCHER_KEYWORDS } from './constants/dispatcher-keywords.js';
import { FEMALE_NAMES } from './constants/female-names.js';
import { FEMALE_SURNAMES } from './constants/female-surnames.js';
import { HEART_EMOJIS } from './constants/heart-emojis.js';
import { STOP_EMOJIS } from './constants/stop-emojis.js';
import { BOT_MESSAGE_PATTERNS } from './constants/bot-message-patterns.js';
import { textHash, countEmojis, countMentions, countConsecutiveEmptyLines } from '../../shared/utils/text-cleaner.js';
import { hasPhone } from '../../shared/utils/phone-normalizer.js';
import {
  MAX_MESSAGE_LENGTH,
  MAX_MENTIONS,
  MAX_EMOJIS,
  MAX_EMPTY_LINES,
  MAX_GROUPS_FOR_SPAM,
  SPAM_MESSAGE_LIMIT,
  SPAM_TIME_WINDOW_MS,
  PHONE_SPAM_GROUP_LIMIT,
  PHONE_SPAM_TIME_WINDOW_MS,
} from '../../common/constants/app.constants.js';

// Dispatcher keywords for message (stage 17) — shorter list
const MESSAGE_DISPATCHER_KEYWORDS = [
  'диспетчер', 'логист', 'экспедитор', 'перевозчик',
  'грузоперевозк', 'автопарк', 'транспортн', 'карго',
  'dispatch', 'logistics', 'carrier',
];

export interface FilterInput {
  messageId: number;
  chatId: bigint;
  senderId: bigint;
  senderName?: string;
  senderBio?: string;
  text: string;
  isForwarded: boolean;
  groupTitle?: string;
}

export interface FilterResult {
  passed: boolean;
  stage?: number;
  note?: string;
  autoBlock?: boolean;
}

@Injectable()
export class MessageFilterService {
  private readonly logger = new Logger(MessageFilterService.name);
  // Per-user dedup: hash -> timestamp
  private readonly userHashes: Map<string, Map<string, number>> = new Map();

  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
  ) {}

  async filter(input: FilterInput): Promise<FilterResult> {
    const stages: Array<() => Promise<FilterResult> | FilterResult> = [
      () => this.stage1DuplicateMessage(input),
      () => this.stage2ProfileDispatcherKeyword(input),
      () => this.stage3ProfileFemaleName(input),
      () => this.stage4ProfileHeartEmoji(input),
      () => this.stage5ProfileStopEmoji(input),
      () => this.stage6SuspiciousProfile(input),
      () => this.stage7BotMessages(input),
      () => this.stage8NoPhone(input),
      () => this.stage9MessageStopEmoji(input),
      () => this.stage10TooManyMentions(input),
      () => this.stage11TooLong(input),
      () => this.stage12TooManyEmojis(input),
      () => this.stage13TooManyEmptyLines(input),
      () => this.stage14TooManyGroups(input),
      () => this.stage15MessageSpam(input),
      () => this.stage16PhoneSpam(input),
      () => this.stage17MessageDispatcherKeyword(input),
    ];

    for (let i = 0; i < stages.length; i++) {
      const result = await stages[i]();
      if (!result.passed) {
        return { ...result, stage: i + 1 };
      }
    }

    return { passed: true };
  }

  // Stage 1: Duplicate message (1 hour, hash, per-user max 100)
  private stage1DuplicateMessage(input: FilterInput): FilterResult {
    const hash = textHash(input.text);
    const userKey = String(input.senderId);
    const now = Date.now();
    const oneHour = 60 * 60 * 1000;

    if (!this.userHashes.has(userKey)) {
      this.userHashes.set(userKey, new Map());
    }

    const userMap = this.userHashes.get(userKey)!;

    // Cleanup old entries
    for (const [h, ts] of userMap) {
      if (now - ts > oneHour) userMap.delete(h);
    }

    // Per-user max 100
    if (userMap.size > 100) {
      const oldest = Array.from(userMap.entries()).sort((a, b) => a[1] - b[1]);
      for (let i = 0; i < oldest.length - 100; i++) {
        userMap.delete(oldest[i][0]);
      }
    }

    if (userMap.has(hash)) {
      return { passed: false, note: 'Dublikat xabar (1 soat ichida)' };
    }

    userMap.set(hash, now);
    return { passed: true };
  }

  // Stage 2: Profile dispatcher keyword (54 keywords)
  private stage2ProfileDispatcherKeyword(input: FilterInput): FilterResult {
    const profile = `${input.senderName || ''} ${input.senderBio || ''}`.toLowerCase();
    for (const kw of DISPATCHER_KEYWORDS) {
      if (profile.includes(kw.toLowerCase())) {
        return { passed: false, note: `Profilda dispatcher keyword: ${kw}`, autoBlock: true };
      }
    }
    return { passed: true };
  }

  // Stage 3: Profile female name (180+ names)
  private stage3ProfileFemaleName(input: FilterInput): FilterResult {
    const name = (input.senderName || '').toLowerCase().trim();
    const firstName = name.split(/\s+/)[0];
    for (const femaleName of FEMALE_NAMES) {
      if (firstName === femaleName.toLowerCase()) {
        return { passed: false, note: `Profilda ayol ismi: ${femaleName}` };
      }
    }
    // Check surnames
    for (const surname of FEMALE_SURNAMES) {
      if (name.includes(surname.toLowerCase())) {
        return { passed: false, note: `Profilda ayol familiyasi: ${surname}` };
      }
    }
    return { passed: true };
  }

  // Stage 4: Profile heart emoji (23)
  private stage4ProfileHeartEmoji(input: FilterInput): FilterResult {
    const profile = `${input.senderName || ''} ${input.senderBio || ''}`;
    for (const emoji of HEART_EMOJIS) {
      if (profile.includes(emoji)) {
        return { passed: false, note: `Profilda yurak emoji: ${emoji}` };
      }
    }
    return { passed: true };
  }

  // Stage 5: Profile stop emoji (6)
  private stage5ProfileStopEmoji(input: FilterInput): FilterResult {
    const profile = `${input.senderName || ''} ${input.senderBio || ''}`;
    for (const emoji of STOP_EMOJIS) {
      if (profile.includes(emoji)) {
        return { passed: false, note: `Profilda stop emoji: ${emoji}`, autoBlock: true };
      }
    }
    return { passed: true };
  }

  // Stage 6: Suspicious profile (@, _998, Unicode, 30+ repeat chars)
  private stage6SuspiciousProfile(input: FilterInput): FilterResult {
    const name = input.senderName || '';

    // @ in name
    if (name.includes('@')) {
      return { passed: false, note: 'Profilda @ belgisi' };
    }

    // _998 pattern
    if (/_998/.test(name)) {
      return { passed: false, note: 'Profilda _998 pattern' };
    }

    // Unusual Unicode
    if (/[\u0600-\u06FF\u0750-\u077F]/.test(name) && !/[\u0400-\u04FF]/.test(name)) {
      return { passed: false, note: 'Profilda shubhali Unicode' };
    }

    // 30+ repeated chars
    if (/(.)\1{29,}/.test(name)) {
      return { passed: false, note: 'Profilda 30+ takroriy belgi' };
    }

    return { passed: true };
  }

  // Stage 7: Bot messages (9 patterns — block but no auto-block)
  private stage7BotMessages(input: FilterInput): FilterResult {
    for (const pattern of BOT_MESSAGE_PATTERNS) {
      if (pattern.test(input.text)) {
        return { passed: false, note: 'Bot xabari', autoBlock: false };
      }
    }
    return { passed: true };
  }

  // Stage 8: No phone number (8 regex)
  private stage8NoPhone(input: FilterInput): FilterResult {
    if (!hasPhone(input.text)) {
      return { passed: false, note: 'Telefon raqam topilmadi' };
    }
    return { passed: true };
  }

  // Stage 9: Stop emoji in message
  private stage9MessageStopEmoji(input: FilterInput): FilterResult {
    for (const emoji of STOP_EMOJIS) {
      if (input.text.includes(emoji)) {
        return { passed: false, note: `Xabarda stop emoji: ${emoji}`, autoBlock: true };
      }
    }
    return { passed: true };
  }

  // Stage 10: 2+ @mentions
  private stage10TooManyMentions(input: FilterInput): FilterResult {
    if (countMentions(input.text) > MAX_MENTIONS) {
      return { passed: false, note: `${MAX_MENTIONS}+ @mention` };
    }
    return { passed: true };
  }

  // Stage 11: 300+ chars
  private stage11TooLong(input: FilterInput): FilterResult {
    if (input.text.length > MAX_MESSAGE_LENGTH) {
      return { passed: false, note: `${MAX_MESSAGE_LENGTH}+ belgi` };
    }
    return { passed: true };
  }

  // Stage 12: 3+ emojis
  private stage12TooManyEmojis(input: FilterInput): FilterResult {
    if (countEmojis(input.text) > MAX_EMOJIS) {
      return { passed: false, note: `${MAX_EMOJIS}+ emoji` };
    }
    return { passed: true };
  }

  // Stage 13: 3+ consecutive empty lines
  private stage13TooManyEmptyLines(input: FilterInput): FilterResult {
    if (countConsecutiveEmptyLines(input.text) > MAX_EMPTY_LINES) {
      return { passed: false, note: `${MAX_EMPTY_LINES}+ ketma-ket bo'sh qator` };
    }
    return { passed: true };
  }

  // Stage 14: 15+ groups message sending
  private async stage14TooManyGroups(input: FilterInput): Promise<FilterResult> {
    const key = `groups:${input.senderId}`;
    const count = await this.redis.incr(key);
    if (count === 1) {
      await this.redis.expire(key, 3600); // 1 hour TTL
    }
    if (count > MAX_GROUPS_FOR_SPAM) {
      return { passed: false, note: `${MAX_GROUPS_FOR_SPAM}+ guruhda xabar`, autoBlock: true };
    }
    return { passed: true };
  }

  // Stage 15: 10+ messages in 5 minutes
  private async stage15MessageSpam(input: FilterInput): Promise<FilterResult> {
    const key = `msgspam:${input.senderId}`;
    const count = await this.redis.incr(key);
    if (count === 1) {
      await this.redis.expire(key, Math.floor(SPAM_TIME_WINDOW_MS / 1000));
    }
    if (count > SPAM_MESSAGE_LIMIT) {
      return { passed: false, note: `${SPAM_MESSAGE_LIMIT}+ xabar 5 daqiqada`, autoBlock: true };
    }
    return { passed: true };
  }

  // Stage 16: Phone spam (15+ groups in 10 minutes)
  private async stage16PhoneSpam(input: FilterInput): Promise<FilterResult> {
    const key = `phonespam:${input.senderId}`;
    const count = await this.redis.incr(key);
    if (count === 1) {
      await this.redis.expire(key, Math.floor(PHONE_SPAM_TIME_WINDOW_MS / 1000));
    }
    if (count > PHONE_SPAM_GROUP_LIMIT) {
      return { passed: false, note: 'Telefon spam', autoBlock: true };
    }
    return { passed: true };
  }

  // Stage 17: Dispatcher keyword in message (11 keywords)
  private stage17MessageDispatcherKeyword(input: FilterInput): FilterResult {
    const text = input.text.toLowerCase();
    for (const kw of MESSAGE_DISPATCHER_KEYWORDS) {
      if (text.includes(kw.toLowerCase())) {
        return { passed: false, note: `Xabarda dispatcher keyword: ${kw}` };
      }
    }
    return { passed: true };
  }
}
