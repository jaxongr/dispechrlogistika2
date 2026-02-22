import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { PrismaService } from '../../prisma/prisma.service.js';
import { SubscriptionCacheService } from './subscription-cache.service.js';
import { RedisService } from '../../shared/redis/redis.service.js';

@Injectable()
export class SubscriptionCheckerService {
  private readonly logger = new Logger(SubscriptionCheckerService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly cache: SubscriptionCacheService,
    private readonly redis: RedisService,
  ) {}

  // Every 5 minutes — check expired subscriptions
  @Cron('*/5 * * * *')
  async deactivateExpired() {
    try {
      const result = await this.prisma.subscription.updateMany({
        where: {
          isActive: true,
          endDate: { lt: new Date() },
        },
        data: { isActive: false },
      });

      if (result.count > 0) {
        this.logger.log(`Deactivated ${result.count} expired subscriptions`);
      }
    } catch (err) {
      this.logger.error('Failed to deactivate expired subscriptions', err);
    }
  }

  // Every hour — send reminders
  @Cron('0 * * * *')
  async sendReminders() {
    try {
      const reminderDays = [7, 5, 3, 1];

      for (const days of reminderDays) {
        await this.sendReminderForDays(days);
      }
    } catch (err) {
      this.logger.error('Failed to send reminders', err);
    }
  }

  private async sendReminderForDays(daysRemaining: number) {
    const now = new Date();
    const target = new Date(now.getTime() + daysRemaining * 24 * 60 * 60 * 1000);
    const targetEnd = new Date(target.getTime() + 60 * 60 * 1000); // 1 hour window

    const subscriptions = await this.prisma.subscription.findMany({
      where: {
        isActive: true,
        endDate: { gte: target, lt: targetEnd },
      },
      include: { user: true },
    });

    const today = now.toISOString().split('T')[0];

    for (const sub of subscriptions) {
      // Dedup: userId_daysRemaining_date
      const dedupKey = `reminder:${sub.userId}_${daysRemaining}_${today}`;
      const alreadySent = await this.redis.exists(dedupKey);

      if (!alreadySent) {
        this.logger.log(
          `Reminder: user=${sub.telegramId}, days=${daysRemaining}, plan=${sub.planType}`,
        );
        // Mark as sent (TTL 24 hours)
        await this.redis.set(dedupKey, '1', 86400);
      }
    }
  }
}
