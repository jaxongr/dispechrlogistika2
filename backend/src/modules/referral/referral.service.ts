import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service.js';
import { PlanType } from '@prisma/client';
import {
  CASHBACK_PERCENT,
  MIN_CASHBACK_AMOUNT,
  PLAN_PRICES,
} from '../../common/constants/app.constants.js';

@Injectable()
export class ReferralService {
  private readonly logger = new Logger(ReferralService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Process cashback for a referral payment
   * Rules:
   * - Trial -> NEVER cashback
   * - < 25,000 UZS -> no cashback
   * - Only FIRST payment: 50% (weekly: 12,500, monthly: 35,000)
   */
  async processCashback(params: {
    referrerVipId: number;
    referredTgId: bigint;
    planType: PlanType;
    paymentAmount: number;
  }) {
    const { referrerVipId, referredTgId, planType, paymentAmount } = params;

    // Trial -> never cashback
    if (planType === PlanType.TRIAL) {
      this.logger.log('No cashback for trial plan');
      return null;
    }

    // Amount < 25,000 -> no cashback
    if (paymentAmount < MIN_CASHBACK_AMOUNT) {
      this.logger.log(`No cashback: amount ${paymentAmount} < ${MIN_CASHBACK_AMOUNT}`);
      return null;
    }

    // Check if first payment from this referred user
    const existingEarning = await this.prisma.referralEarning.findFirst({
      where: { vipUserId: referrerVipId, referredTgId },
    });

    if (existingEarning) {
      this.logger.log('No cashback: not first payment');
      return null;
    }

    // Calculate cashback: 50%
    const cashbackAmount = Math.floor(paymentAmount * (CASHBACK_PERCENT / 100));

    // Create earning record
    const earning = await this.prisma.referralEarning.create({
      data: {
        vipUserId: referrerVipId,
        referredTgId,
        planType,
        paymentAmount,
        cashbackAmount,
        cashbackPercent: CASHBACK_PERCENT,
      },
    });

    // Update VIP user totals
    await this.prisma.vipUser.update({
      where: { id: referrerVipId },
      data: {
        totalEarnings: { increment: cashbackAmount },
        totalReferrals: { increment: 1 },
      },
    });

    // Update user balance
    const vipUser = await this.prisma.vipUser.findUnique({ where: { id: referrerVipId } });
    if (vipUser) {
      await this.prisma.userBalance.upsert({
        where: { telegramId: vipUser.telegramId },
        update: {
          balance: { increment: cashbackAmount },
          totalEarned: { increment: cashbackAmount },
        },
        create: {
          userId: vipUser.userId,
          telegramId: vipUser.telegramId,
          balance: cashbackAmount,
          totalEarned: cashbackAmount,
        },
      });
    }

    this.logger.log(
      `Cashback: VIP=${referrerVipId}, amount=${cashbackAmount}, plan=${planType}`,
    );

    return earning;
  }
}
