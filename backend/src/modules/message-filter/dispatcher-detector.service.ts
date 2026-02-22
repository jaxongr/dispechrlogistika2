import { Injectable, Logger } from '@nestjs/common';
import { DISPATCHER_KEYWORDS } from './constants/dispatcher-keywords.js';
import { extractPhones } from '../../shared/utils/phone-normalizer.js';
import { countEmojis } from '../../shared/utils/text-cleaner.js';

export interface DetectionResult {
  isDispatcher: boolean;
  confidence: number;
  action: 'FULL_BLOCK' | 'SKIP' | 'PASS';
  keywords: string[];
  reasons: string[];
}

const OWNER_KEYWORDS_POSITIVE = [
  'хозяин', 'хозяйка', 'владелец', 'собственник', 'шахсий',
  'свой груз', 'свой товар', 'свои вещи', 'o\'z yuki', 'o\'zim',
];

const OWNER_KEYWORDS_NEGATIVE = [
  'диспетчер', 'логист', 'экспедитор', 'компания', 'фирма',
  'ООО', 'ИП', 'ЧП', 'МЧЖ',
];

const URGENCY_KEYWORDS = ['срочно', 'срочный', 'urgent', 'tezkor', 'shoshilinch'];

@Injectable()
export class DispatcherDetectorService {
  private readonly logger = new Logger(DispatcherDetectorService.name);

  detect(params: {
    senderName?: string;
    senderBio?: string;
    text: string;
  }): DetectionResult {
    let confidence = 0;
    const keywords: string[] = [];
    const reasons: string[] = [];
    const fullText = `${params.senderName || ''} ${params.senderBio || ''} ${params.text}`.toLowerCase();

    // Dispatcher keywords: +0.3 each
    for (const kw of DISPATCHER_KEYWORDS) {
      if (fullText.includes(kw.toLowerCase())) {
        confidence += 0.3;
        keywords.push(kw);
        reasons.push(`Dispatcher keyword: ${kw} (+0.3)`);
      }
    }

    // Owner keywords: dispatcher -0.2, owner +0.3
    for (const kw of OWNER_KEYWORDS_NEGATIVE) {
      if (fullText.includes(kw.toLowerCase())) {
        confidence -= 0.2;
        reasons.push(`Owner negative keyword: ${kw} (-0.2)`);
      }
    }

    for (const kw of OWNER_KEYWORDS_POSITIVE) {
      if (fullText.includes(kw.toLowerCase())) {
        confidence += 0.3;
        reasons.push(`Owner positive keyword: ${kw} (+0.3)`);
      }
    }

    // 3+ phone numbers: +0.4
    const phones = extractPhones(params.text);
    if (phones.length >= 3) {
      confidence += 0.4;
      reasons.push(`${phones.length} telefon raqam (+0.4)`);
    }

    // 10+ emojis: +0.2
    const emojiCount = countEmojis(params.text);
    if (emojiCount >= 10) {
      confidence += 0.2;
      reasons.push(`${emojiCount} emoji (+0.2)`);
    }

    // 5+ urgency keywords: +0.3
    let urgencyCount = 0;
    for (const kw of URGENCY_KEYWORDS) {
      const regex = new RegExp(kw, 'gi');
      const matches = params.text.match(regex);
      if (matches) urgencyCount += matches.length;
    }
    if (urgencyCount >= 5) {
      confidence += 0.3;
      reasons.push(`${urgencyCount}x "срочно" (+0.3)`);
    }

    // Clamp confidence
    confidence = Math.max(0, Math.min(1, confidence));

    // Decision
    let action: DetectionResult['action'];
    if (confidence >= 0.5) {
      action = 'FULL_BLOCK';
    } else if (confidence >= 0.3) {
      action = 'SKIP';
    } else {
      action = 'PASS';
    }

    return {
      isDispatcher: confidence >= 0.3,
      confidence: Math.round(confidence * 100) / 100,
      action,
      keywords,
      reasons,
    };
  }
}
