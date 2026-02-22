import { Controller, Get, Post, Body, UseGuards, Query } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { SubscriptionService } from './subscription.service.js';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { RolesGuard } from '../auth/guards/roles.guard.js';
import { Roles } from '../../common/decorators/roles.decorator.js';

@ApiTags('Subscriptions')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('admin')
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
