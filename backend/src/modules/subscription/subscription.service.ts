import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service.js';
import { SubscriptionCacheService } from './subscription-cache.service.js';
import {
  PLAN_PRICES,
  PLAN_DURATIONS_MS,
  GRANDFATHER_CUTOFF,
} from '../../common/constants/app.constants.js';
import { PlanType } from '@prisma/client';

@Injectable()
export class SubscriptionService {
  private readonly logger = new Logger(SubscriptionService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly cache: SubscriptionCacheService,
  ) {}

  async createSubscription(params: {
    userId: number;
    telegramId: bigint;
    planType: PlanType;
    paymentId?: number;
  }) {
    const { userId, telegramId, planType, paymentId } = params;

    // Validate trial
    if (planType === PlanType.TRIAL) {
      await this.validateTrial(userId, telegramId);
    }

    // Validate grandfather
    if (planType === PlanType.GRANDFATHER) {
      await this.validateGrandfather(telegramId);
    }

    // Deactivate existing subscriptions
    await this.prisma.subscription.updateMany({
      where: { userId, isActive: true },
      data: { isActive: false },
    });

    const now = new Date();
    let endDate: Date;

    if (planType === PlanType.GRANDFATHER) {
      endDate = new Date('2099-12-31T23:59:59.000Z');
    } else {
      const duration = PLAN_DURATIONS_MS[planType] || PLAN_DURATIONS_MS.DAILY;
      endDate = new Date(now.getTime() + duration);
    }

    const subscription = await this.prisma.subscription.create({
      data: {
        userId,
        telegramId,
        planType,
        startDate: now,
        endDate,
        isActive: true,
        paymentId,
      },
    });

    // Invalidate cache
    await this.cache.invalidate(telegramId);

    this.logger.log(`Subscription created: user=${telegramId}, plan=${planType}`);
    return subscription;
  }

  private async validateTrial(userId: number, telegramId: bigint) {
    // Trial only once
    const existingTrial = await this.prisma.subscription.findFirst({
      where: { userId, planType: PlanType.TRIAL },
    });

    if (existingTrial) {
      throw new BadRequestException('Trial allaqachon ishlatilgan');
    }

    // Trial only for users who haven't used weekly/monthly
    const paidSub = await this.prisma.subscription.findFirst({
      where: {
        userId,
        planType: { in: [PlanType.WEEKLY, PlanType.MONTHLY] },
      },
    });

    if (paidSub) {
      throw new BadRequestException('Trial faqat yangi foydalanuvchilar uchun');
    }
  }

  private async validateGrandfather(telegramId: bigint) {
    const user = await this.prisma.botUser.findUnique({
      where: { telegramId },
    });

    if (!user || user.createdAt > GRANDFATHER_CUTOFF) {
      throw new BadRequestException('Grandfather rejasi uchun mos emassiz');
    }
  }

  async getActiveSubscription(telegramId: bigint) {
    return this.prisma.subscription.findFirst({
      where: {
        telegramId,
        isActive: true,
        endDate: { gte: new Date() },
      },
      orderBy: { endDate: 'desc' },
    });
  }

  async hasActiveSubscription(telegramId: bigint): Promise<boolean> {
    // Check cache first
    const cached = await this.cache.get(telegramId);
    if (cached !== null) return cached;

    const sub = await this.getActiveSubscription(telegramId);
    const isActive = !!sub;

    await this.cache.set(telegramId, isActive);
    return isActive;
  }

  async getExpiringSubscriptions(daysRemaining: number) {
    const now = new Date();
    const target = new Date(now.getTime() + daysRemaining * 24 * 60 * 60 * 1000);
    const targetNext = new Date(target.getTime() + 24 * 60 * 60 * 1000);

    return this.prisma.subscription.findMany({
      where: {
        isActive: true,
        endDate: { gte: target, lt: targetNext },
      },
      include: { user: true },
    });
  }

  async getStats() {
    const [total, active, trial, daily, weekly, monthly, grandfather] = await Promise.all([
      this.prisma.subscription.count(),
      this.prisma.subscription.count({ where: { isActive: true, endDate: { gte: new Date() } } }),
      this.prisma.subscription.count({ where: { planType: PlanType.TRIAL, isActive: true } }),
      this.prisma.subscription.count({ where: { planType: PlanType.DAILY, isActive: true } }),
      this.prisma.subscription.count({ where: { planType: PlanType.WEEKLY, isActive: true } }),
      this.prisma.subscription.count({ where: { planType: PlanType.MONTHLY, isActive: true } }),
      this.prisma.subscription.count({ where: { planType: PlanType.GRANDFATHER, isActive: true } }),
    ]);

    return { total, active, byPlan: { trial, daily, weekly, monthly, grandfather } };
  }

  getPlanPrice(planType: PlanType): number {
    return PLAN_PRICES[planType] ?? 0;
  }
}
