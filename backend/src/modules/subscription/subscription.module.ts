import { Module } from '@nestjs/common';
import { SubscriptionService } from './subscription.service.js';
import { SubscriptionCheckerService } from './subscription-checker.service.js';
import { SubscriptionCacheService } from './subscription-cache.service.js';
import { SubscriptionController } from './subscription.controller.js';

@Module({
  providers: [SubscriptionService, SubscriptionCheckerService, SubscriptionCacheService],
  controllers: [SubscriptionController],
  exports: [SubscriptionService, SubscriptionCacheService],
})
export class SubscriptionModule {}
