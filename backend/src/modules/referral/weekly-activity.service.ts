import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { PrismaService } from '../../prisma/prisma.service.js';
import { VipUserService } from './vip-user.service.js';

@Injectable()
export class WeeklyActivityService {
  private readonly logger = new Logger(WeeklyActivityService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly vipUserService: VipUserService,
  ) {}

  // Every Monday at 00:00 Tashkent (Sunday 19:00 UTC)
  @Cron('0 19 * * 0')
  async checkWeeklyActivity() {
    try {
      const activeVips = await this.prisma.vipUser.findMany({
        where: { isActive: true },
        include: { user: true },
      });

      const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

      for (const vip of activeVips) {
        // Check if VIP had any referral activity in the last week
        const recentActivity = await this.prisma.referralEarning.findFirst({
          where: {
            vipUserId: vip.id,
            createdAt: { gte: oneWeekAgo },
          },
        });

        if (!recentActivity) {
          // Check tracking for any activity
          const recentTracking = await this.prisma.vipReferralTracking.findFirst({
            where: {
              vipUserId: vip.id,
              createdAt: { gte: oneWeekAgo },
            },
          });

          if (!recentTracking) {
            await this.vipUserService.suspendVip(vip.telegramId);
            this.logger.log(`Suspended inactive VIP: ${vip.vipCode} (${vip.telegramId})`);
          }
        }
      }
    } catch (err) {
      this.logger.error('Weekly activity check failed', err);
    }
  }
}
