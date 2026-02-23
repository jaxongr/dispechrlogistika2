import { Controller, Get, Query } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { SubscriptionService } from './subscription.service.js';
import { Public } from '../../common/decorators/public.decorator.js';

@ApiTags('Subscriptions')
@Public()
@Controller('api/subscriptions')
export class SubscriptionController {
  constructor(private readonly subscriptionService: SubscriptionService) {}

  @Get('stats')
  @ApiOperation({ summary: 'Get subscription statistics' })
  async getStats() {
    return this.subscriptionService.getStats();
  }

  @Get('expiring')
  @ApiOperation({ summary: 'Get expiring subscriptions' })
  async getExpiring(@Query('days') days: number = 3) {
    return this.subscriptionService.getExpiringSubscriptions(days);
  }
}
