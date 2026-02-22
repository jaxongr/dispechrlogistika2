import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { PrismaService } from '../../prisma/prisma.service.js';
import { MAX_AI_BLOCKED_USERS } from '../../common/constants/app.constants.js';

@Injectable()
export class BlockedUsersCleanupService {
  private readonly logger = new Logger(BlockedUsersCleanupService.name);

  constructor(private readonly prisma: PrismaService) {}

  // Every day at 00:00 UTC (05:00 Tashkent)
  @Cron('0 0 * * *')
  async cleanup() {
    try {
      const count = await this.prisma.aIBlockedUser.count();

      if (count > MAX_AI_BLOCKED_USERS) {
        const excess = count - MAX_AI_BLOCKED_USERS;

        // Delete oldest entries
        const oldest = await this.prisma.aIBlockedUser.findMany({
          orderBy: { createdAt: 'asc' },
          take: excess,
          select: { id: true },
        });

        await this.prisma.aIBlockedUser.deleteMany({
          where: { id: { in: oldest.map((o) => o.id) } },
        });

        this.logger.log(`Cleaned up ${excess} AI blocked users (limit: ${MAX_AI_BLOCKED_USERS})`);
      }
    } catch (err) {
      this.logger.error('Failed to cleanup AI blocked users', err);
    }
  }
}
