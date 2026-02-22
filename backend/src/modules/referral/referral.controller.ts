import { Controller, Get, UseGuards, Query } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { VipUserService } from './vip-user.service.js';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { RolesGuard } from '../auth/guards/roles.guard.js';
import { Roles } from '../../common/decorators/roles.decorator.js';

@ApiTags('VIP & Referral')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('admin')
@Controller('api/vip')
export class ReferralController {
  constructor(private readonly vipUserService: VipUserService) {}

  @Get()
  @ApiOperation({ summary: 'List VIP users' })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'limit', required: false })
  async findAll(@Query('page') page?: number, @Query('limit') limit?: number) {
    return this.vipUserService.findAll({ page, limit });
  }

  @Get('stats')
  @ApiOperation({ summary: 'VIP statistics' })
  async getStats() {
    return this.vipUserService.getStats();
  }
}
