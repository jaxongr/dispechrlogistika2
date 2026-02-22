import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PlanType } from '@prisma/client';
import { PLAN_PRICES } from '../../common/constants/app.constants.js';

@Injectable()
export class PaymentLinkService {
  private readonly clickServiceId: string;
  private readonly clickMerchantId: string;
  private readonly paymeMerchantId: string;

  constructor(private readonly config: ConfigService) {
    this.clickServiceId = this.config.get<string>('CLICK_SERVICE_ID', '');
    this.clickMerchantId = this.config.get<string>('CLICK_MERCHANT_ID', '');
    this.paymeMerchantId = this.config.get<string>('PAYME_MERCHANT_ID', '');
  }

  generateClickLink(telegramId: string, planType: PlanType, referralCode?: string): string {
    const amount = PLAN_PRICES[planType];
    let merchantTransId = `${telegramId}:${planType}`;

    if (referralCode) {
      merchantTransId = `${telegramId}:${planType}_ref:${referralCode}`;
    }

    return (
      `https://my.click.uz/services/pay?service_id=${this.clickServiceId}` +
      `&merchant_id=${this.clickMerchantId}` +
      `&amount=${amount}` +
      `&transaction_param=${merchantTransId}`
    );
  }

  generatePaymeLink(telegramId: string, planType: PlanType): string {
    const amount = PLAN_PRICES[planType] * 100; // Payme uses tiyin

    const params = Buffer.from(
      `m=${this.paymeMerchantId};ac.telegram_id=${telegramId};ac.plan_type=${planType};a=${amount}`,
    ).toString('base64');

    return `https://checkout.paycom.uz/${params}`;
  }

  generateLinks(telegramId: string, planType: PlanType, referralCode?: string) {
    return {
      click: this.generateClickLink(telegramId, planType, referralCode),
      payme: this.generatePaymeLink(telegramId, planType),
    };
  }
}
