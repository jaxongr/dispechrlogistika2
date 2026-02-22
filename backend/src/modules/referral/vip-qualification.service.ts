import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service.js';
import { VIP_QUALIFICATION_THRESHOLD } from '../../common/constants/app.constants.js';

@Injectable()
export class VipQualificationService {
  private readonly logger = new Logger(VipQualificationService.name);

  constructor(private readonly prisma: PrismaService) {}

  async incrementDispatcherBlocked(telegramId: bigint) {
    const qualification = await this.prisma.vipQualification.upsert({
      where: { telegramId },
      update: { dispatchersBlocked: { increment: 1 } },
      create: { telegramId, dispatchersBlocked: 1 },
    });

    // Check if qualified (5 dispatchers = VIP)
    if (
      !qualification.isQualified &&
      qualification.dispatchersBlocked >= VIP_QUALIFICATION_THRESHOLD
    ) {
      await this.prisma.vipQualification.update({
        where: { telegramId },
        data: { isQualified: true, qualifiedAt: new Date() },
      });

      this.logger.log(`User ${telegramId} qualified for VIP!`);
      return { qualified: true, count: qualification.dispatchersBlocked };
    }

    return {
      qualified: qualification.isQualified,
      count: qualification.dispatchersBlocked,
      remaining: Math.max(0, VIP_QUALIFICATION_THRESHOLD - qualification.dispatchersBlocked),
    };
  }

  async isQualified(telegramId: bigint): Promise<boolean> {
    const q = await this.prisma.vipQualification.findUnique({ where: { telegramId } });
    return q?.isQualified || false;
  }
}
