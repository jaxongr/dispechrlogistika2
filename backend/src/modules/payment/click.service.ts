import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createHash } from 'crypto';
import { PrismaService } from '../../prisma/prisma.service.js';
import { SubscriptionService } from '../subscription/subscription.service.js';
import { PaymentStatus, PaymentMethod, PlanType } from '@prisma/client';

@Injectable()
export class ClickService {
  private readonly logger = new Logger(ClickService.name);
  private readonly serviceId: string;
  private readonly secretKey: string;

  constructor(
    private readonly config: ConfigService,
    private readonly prisma: PrismaService,
    private readonly subscriptionService: SubscriptionService,
  ) {
    this.serviceId = this.config.get<string>('CLICK_SERVICE_ID', '');
    this.secretKey = this.config.get<string>('CLICK_SECRET_KEY', '');
  }

  async prepare(body: any) {
    const {
      click_trans_id,
      service_id,
      merchant_trans_id,
      amount,
      action,
      sign_time,
      sign_string,
    } = body;

    // Verify signature
    const expectedSign = this.generateSignature(
      click_trans_id, service_id, this.secretKey, merchant_trans_id, amount, action, sign_time,
    );

    if (sign_string !== expectedSign) {
      return this.errorResponse(-1, 'SIGN CHECK FAILED', merchant_trans_id);
    }

    // Parse merchant_trans_id: "telegram_user_id:plan_type" or "telegram_user_id:plan_type_ref:code"
    const parsed = this.parseMerchantTransId(merchant_trans_id);
    if (!parsed) {
      return this.errorResponse(-5, 'Invalid merchant_trans_id', merchant_trans_id);
    }

    // Check user exists
    const user = await this.prisma.botUser.findUnique({
      where: { telegramId: BigInt(parsed.telegramId) },
    });

    if (!user) {
      return this.errorResponse(-5, 'User not found', merchant_trans_id);
    }

    // Verify amount matches plan
    const expectedAmount = this.subscriptionService.getPlanPrice(parsed.planType as PlanType);
    if (Number(amount) !== expectedAmount) {
      return this.errorResponse(-2, 'Incorrect amount', merchant_trans_id);
    }

    // Check for duplicate
    const existing = await this.prisma.payment.findFirst({
      where: { transactionId: String(click_trans_id) },
    });

    if (existing) {
      return this.errorResponse(-4, 'Transaction already exists', merchant_trans_id);
    }

    // Create payment record
    await this.prisma.payment.create({
      data: {
        userId: user.id,
        telegramId: user.telegramId,
        planType: parsed.planType as PlanType,
        amount: Number(amount),
        paymentMethod: PaymentMethod.CLICK,
        status: PaymentStatus.PENDING,
        transactionId: String(click_trans_id),
        referralCode: parsed.referralCode,
      },
    });

    return {
      click_trans_id,
      merchant_trans_id,
      merchant_prepare_id: click_trans_id,
      error: 0,
      error_note: 'Success',
    };
  }

  async complete(body: any) {
    const {
      click_trans_id,
      service_id,
      merchant_trans_id,
      merchant_prepare_id,
      amount,
      action,
      sign_time,
      sign_string,
      error,
    } = body;

    // Verify signature
    const expectedSign = this.generateSignature(
      click_trans_id, service_id, this.secretKey, merchant_trans_id,
      merchant_prepare_id, amount, action, sign_time,
    );

    if (sign_string !== expectedSign) {
      return this.errorResponse(-1, 'SIGN CHECK FAILED', merchant_trans_id);
    }

    const payment = await this.prisma.payment.findUnique({
      where: { transactionId: String(click_trans_id) },
    });

    if (!payment) {
      return this.errorResponse(-5, 'Transaction not found', merchant_trans_id);
    }

    if (payment.status === PaymentStatus.COMPLETED) {
      return this.errorResponse(-4, 'Already completed', merchant_trans_id);
    }

    // Check if Click reported error
    if (Number(error) < 0) {
      await this.prisma.payment.update({
        where: { id: payment.id },
        data: { status: PaymentStatus.FAILED },
      });
      return this.errorResponse(-8, 'Transaction cancelled', merchant_trans_id);
    }

    // Complete payment
    await this.prisma.payment.update({
      where: { id: payment.id },
      data: { status: PaymentStatus.COMPLETED },
    });

    // Create subscription
    const user = await this.prisma.botUser.findUnique({
      where: { telegramId: payment.telegramId },
    });

    if (user) {
      await this.subscriptionService.createSubscription({
        userId: user.id,
        telegramId: user.telegramId,
        planType: payment.planType,
        paymentId: payment.id,
      });
    }

    this.logger.log(`Click payment completed: ${click_trans_id}, user=${payment.telegramId}`);

    return {
      click_trans_id,
      merchant_trans_id,
      merchant_confirm_id: click_trans_id,
      error: 0,
      error_note: 'Success',
    };
  }

  private generateSignature(...parts: any[]): string {
    const data = parts.join('');
    return createHash('md5').update(data).digest('hex');
  }

  private parseMerchantTransId(id: string) {
    const parts = id.split(':');
    if (parts.length < 2) return null;

    const result: { telegramId: string; planType: string; referralCode?: string } = {
      telegramId: parts[0],
      planType: parts[1],
    };

    // Check for referral: "tgid:plan_ref:code"
    if (parts.length >= 3 && parts[1].endsWith('_ref')) {
      result.planType = parts[1].replace('_ref', '');
      result.referralCode = parts[2];
    }

    return result;
  }

  private errorResponse(error: number, errorNote: string, merchantTransId: string) {
    return { error, error_note: errorNote, merchant_trans_id: merchantTransId };
  }
}
