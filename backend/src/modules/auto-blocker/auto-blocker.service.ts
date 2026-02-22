import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service.js';
import { SmsNotificationService } from './sms-notification.service.js';
import { MAX_AI_BLOCKED_USERS } from '../../common/constants/app.constants.js';

@Injectable()
export class AutoBlockerService {
  private readonly logger = new Logger(AutoBlockerService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly sms: SmsNotificationService,
  ) {}

  async blockUser(params: {
    userId: bigint;
    username?: string;
    firstName?: string;
    lastName?: string;
    phone?: string;
    reason: string;
  }) {
    try {
      // Create blocked user (blocked_by: "0" = auto-block)
      await this.prisma.blockedUser.create({
        data: {
          userId: params.userId,
          username: params.username,
          firstName: params.firstName,
          lastName: params.lastName,
          phone: params.phone,
          reason: params.reason,
          blockedBy: '0',
        },
      });

      // Send SMS notification
      if (params.phone) {
        await this.sms.sendBlockNotification(params.phone, params.reason);
      }

      this.logger.log(`Auto-blocked user ${params.userId}: ${params.reason}`);
      return true;
    } catch (err) {
      this.logger.error(`Failed to auto-block user ${params.userId}`, err);
      return false;
    }
  }

  async aiBlockUser(params: {
    userId: bigint;
    username?: string;
    firstName?: string;
    lastName?: string;
    phone?: string;
    reason: string;
    confidence: number;
    keywords: string[];
    messagePreview?: string;
  }) {
    try {
      // Check AI blocked limit
      const currentCount = await this.prisma.aIBlockedUser.count();
      if (currentCount >= MAX_AI_BLOCKED_USERS) {
        this.logger.warn(`AI blocked users limit reached: ${currentCount}/${MAX_AI_BLOCKED_USERS}`);
        return false;
      }

      await this.prisma.aIBlockedUser.create({
        data: {
          userId: params.userId,
          username: params.username,
          firstName: params.firstName,
          lastName: params.lastName,
          phone: params.phone,
          reason: params.reason,
          confidence: params.confidence,
          keywords: params.keywords,
          messagePreview: params.messagePreview,
        },
      });

      // Send SMS
      if (params.phone) {
        await this.sms.sendBlockNotification(params.phone, params.reason);
      }

      this.logger.log(
        `AI-blocked user ${params.userId}: confidence=${params.confidence}, reason=${params.reason}`,
      );
      return true;
    } catch (err) {
      this.logger.error(`Failed to AI-block user ${params.userId}`, err);
      return false;
    }
  }

  async isBlocked(userId: bigint): Promise<boolean> {
    const [blocked, aiBlocked] = await Promise.all([
      this.prisma.blockedUser.findFirst({ where: { userId } }),
      this.prisma.aIBlockedUser.findFirst({ where: { userId } }),
    ]);
    return !!(blocked || aiBlocked);
  }

  async unblockUser(userId: bigint) {
    await Promise.all([
      this.prisma.blockedUser.deleteMany({ where: { userId } }),
      this.prisma.aIBlockedUser.deleteMany({ where: { userId } }),
    ]);
    this.logger.log(`Unblocked user ${userId}`);
  }
}
