import { Controller, Get, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { VipUserService } from './vip-user.service.js';
import { Public } from '../../common/decorators/public.decorator.js';

@ApiTags('VIP & Referral')
@Public()
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
