import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Telegraf, Context } from 'telegraf';
import { PrismaService } from '../../prisma/prisma.service.js';
import { RedisService } from '../../shared/redis/redis.service.js';
import { SUBSCRIPTION_CACHE_PREFIX, SUBSCRIPTION_CACHE_TTL } from '../../common/constants/app.constants.js';

@Injectable()
export class TelegramBotProtection {
  private readonly logger = new Logger(TelegramBotProtection.name);
  private readonly targetGroupId: string;

  constructor(
    private readonly config: ConfigService,
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
  ) {
    this.targetGroupId = this.config.get<string>('TARGET_GROUP_ID', '-1003131208840');
  }

  register(bot: Telegraf) {
    bot.on('chat_member', async (ctx) => {
      try {
        await this.handleChatMember(ctx);
      } catch (err) {
        this.logger.error('Chat member handler error', err);
      }
    });
  }

  private async handleChatMember(ctx: Context) {
    const update = (ctx as any).chatMember;
    if (!update) return;

    const chatId = String(update.chat.id);

    // Only process for the target premium group
    if (chatId !== this.targetGroupId) return;

    const newStatus = update.new_chat_member?.status;
    const userId = update.new_chat_member?.user?.id;

    if (!userId) return;

    // New member joined
    if (newStatus === 'member' || newStatus === 'restricted') {
      const hasSubscription = await this.checkSubscription(BigInt(userId));

      if (!hasSubscription) {
        this.logger.warn(`Unsubscribed user ${userId} joined premium group, banning for 5 min`);

        try {
          // Ban for 5 minutes
          const banUntil = Math.floor(Date.now() / 1000) + 300;
          await (ctx.telegram.banChatMember as any)(chatId, userId, banUntil);

          // Notify user
          try {
            await ctx.telegram.sendMessage(
              userId,
              '⚠️ Ushbu guruhga kirish uchun <b>aktiv obuna</b> kerak.\n\n' +
                '💳 <b>Obuna bo\'lish</b> tugmasini bosib, obuna sotib oling.',
              { parse_mode: 'HTML' },
            );
          } catch {
            // User may have blocked the bot
          }
        } catch (err) {
          this.logger.error(`Failed to ban user ${userId}`, err);
        }
      }
    }
  }

  async checkSubscription(telegramId: bigint): Promise<boolean> {
    // Check Redis cache first
    const cacheKey = `${SUBSCRIPTION_CACHE_PREFIX}${telegramId}`;
    const cached = await this.redis.get(cacheKey);
    if (cached !== null) {
      return cached === '1';
    }

    // Check database
    const activeSub = await this.prisma.subscription.findFirst({
      where: {
        telegramId,
        isActive: true,
        endDate: { gte: new Date() },
      },
    });

    const hasActive = !!activeSub;

    // Cache result
    await this.redis.set(cacheKey, hasActive ? '1' : '0', SUBSCRIPTION_CACHE_TTL);

    return hasActive;
  }
}
