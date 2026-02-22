import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service.js';
import { SubscriptionService } from '../subscription/subscription.service.js';
import { PlanType } from '@prisma/client';

class PaymeError extends Error {
  rpcError: { code: number; message: string };
  constructor(code: number, message: string) {
    super(message);
    this.rpcError = { code, message };
  }
}

@Injectable()
export class PaymeService {
  private readonly logger = new Logger(PaymeService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly subscriptionService: SubscriptionService,
  ) {}

  async checkPerformTransaction(params: any) {
    const { amount, account } = params;

    if (!account?.telegram_id || !account?.plan_type) {
      throw new PaymeError(-31050, 'Invalid account parameters');
    }

    const user = await this.prisma.botUser.findUnique({
      where: { telegramId: BigInt(account.telegram_id) },
    });

    if (!user) {
      throw new PaymeError(-31050, 'User not found');
    }

    // Payme uses tiyin (amount * 100)
    const planPrice = this.subscriptionService.getPlanPrice(account.plan_type as PlanType) * 100;
    if (amount !== planPrice) {
      throw new PaymeError(-31001, 'Incorrect amount');
    }

    return { allow: true };
  }

  async createTransaction(params: any) {
    const { id: paymeId, time, amount, account } = params;

    // Check if transaction already exists
    let transaction = await this.prisma.paymeTransaction.findUnique({
      where: { paymeId },
    });

    if (transaction) {
      if (transaction.state !== 1) {
        throw new PaymeError(-31003, 'Transaction cannot be re-created');
      }
      return {
        create_time: Number(transaction.createTime),
        transaction: transaction.transactionId,
        state: transaction.state,
      };
    }

    // Validate
    await this.checkPerformTransaction(params);

    // Create
    transaction = await this.prisma.paymeTransaction.create({
      data: {
        transactionId: `payme_${Date.now()}_${account.telegram_id}`,
        paymeId,
        telegramId: BigInt(account.telegram_id),
        planType: account.plan_type as PlanType,
        amount: amount / 100, // Convert from tiyin to UZS
        state: 1,
        createTime: BigInt(time),
      },
    });

    this.logger.log(`Payme transaction created: ${paymeId}`);

    return {
      create_time: Number(transaction.createTime),
      transaction: transaction.transactionId,
      state: transaction.state,
    };
  }

  async performTransaction(params: any) {
    const { id: paymeId } = params;

    const transaction = await this.prisma.paymeTransaction.findUnique({
      where: { paymeId },
    });

    if (!transaction) {
      throw new PaymeError(-31003, 'Transaction not found');
    }

    if (transaction.state !== 1) {
      if (transaction.state === 2) {
        return {
          perform_time: Number(transaction.performTime),
          transaction: transaction.transactionId,
          state: 2,
        };
      }
      throw new PaymeError(-31003, 'Cannot perform this transaction');
    }

    const now = Date.now();

    // Update transaction
    const updated = await this.prisma.paymeTransaction.update({
      where: { id: transaction.id },
      data: { state: 2, performTime: BigInt(now) },
    });

    // Create subscription
    const user = await this.prisma.botUser.findUnique({
      where: { telegramId: transaction.telegramId },
    });

    if (user) {
      await this.subscriptionService.createSubscription({
        userId: user.id,
        telegramId: user.telegramId,
        planType: transaction.planType,
      });
    }

    this.logger.log(`Payme transaction performed: ${paymeId}`);

    return {
      perform_time: now,
      transaction: updated.transactionId,
      state: 2,
    };
  }

  async cancelTransaction(params: any) {
    const { id: paymeId, reason } = params;

    const transaction = await this.prisma.paymeTransaction.findUnique({
      where: { paymeId },
    });

    if (!transaction) {
      throw new PaymeError(-31003, 'Transaction not found');
    }

    const now = Date.now();

    const updated = await this.prisma.paymeTransaction.update({
      where: { id: transaction.id },
      data: {
        state: transaction.state === 1 ? -1 : -2,
        cancelTime: BigInt(now),
        reason,
      },
    });

    return {
      cancel_time: now,
      transaction: updated.transactionId,
      state: updated.state,
    };
  }

  async checkTransaction(params: any) {
    const { id: paymeId } = params;

    const transaction = await this.prisma.paymeTransaction.findUnique({
      where: { paymeId },
    });

    if (!transaction) {
      throw new PaymeError(-31003, 'Transaction not found');
    }

    return {
      create_time: Number(transaction.createTime),
      perform_time: Number(transaction.performTime || 0),
      cancel_time: Number(transaction.cancelTime || 0),
      transaction: transaction.transactionId,
      state: transaction.state,
      reason: transaction.reason,
    };
  }
}
