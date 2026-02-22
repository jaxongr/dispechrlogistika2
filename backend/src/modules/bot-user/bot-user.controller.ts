import {
  Controller,
  Get,
  Param,
  Query,
  Patch,
  UseGuards,
  ParseIntPipe,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { BotUserService } from './bot-user.service.js';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { RolesGuard } from '../auth/guards/roles.guard.js';
import { Roles } from '../../common/decorators/roles.decorator.js';

@ApiTags('Bot Users')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('admin')
@Controller('api/bot-users')
export class BotUserController {
  constructor(private readonly botUserService: BotUserService) {}

  @Get()
  @ApiOperation({ summary: 'List bot users' })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'limit', required: false })
  @ApiQuery({ name: 'search', required: false })
  async findAll(
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('search') search?: string,
  ) {
    return this.botUserService.findAll({ page, limit, search });
  }

  @Get('stats')
  @ApiOperation({ summary: 'Get user statistics' })
  async getStats() {
    return this.botUserService.getStats();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get user by ID' })
  async findOne(@Param('id', ParseIntPipe) id: number) {
    return this.botUserService.findById(id);
  }

  @Patch(':telegramId/block')
  @ApiOperation({ summary: 'Block user' })
  async block(@Param('telegramId') telegramId: string) {
    return this.botUserService.blockUser(BigInt(telegramId));
  }

  @Patch(':telegramId/unblock')
  @ApiOperation({ summary: 'Unblock user' })
  async unblock(@Param('telegramId') telegramId: string) {
    return this.botUserService.unblockUser(BigInt(telegramId));
  }
}
