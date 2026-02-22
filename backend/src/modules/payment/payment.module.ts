import { Module } from '@nestjs/common';
import { ClickController } from './click.controller.js';
import { ClickService } from './click.service.js';
import { PaymeController } from './payme.controller.js';
import { PaymeService } from './payme.service.js';
import { PaymentLinkService } from './payment-link.service.js';
import { PaymentController } from './payment.controller.js';
import { SubscriptionModule } from '../subscription/subscription.module.js';

@Module({
  imports: [SubscriptionModule],
  controllers: [ClickController, PaymeController, PaymentController],
  providers: [ClickService, PaymeService, PaymentLinkService],
  exports: [ClickService, PaymeService, PaymentLinkService],
})
export class PaymentModule {}
