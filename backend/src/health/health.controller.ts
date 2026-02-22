import { Controller, Get } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { RedisService } from '../shared/redis/redis.service.js';

@Controller('health')
export class HealthController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
  ) {}

  @Get()
  async check() {
    const checks: Record<string, string> = {};

    try {
      await this.prisma.$queryRawUnsafe('SELECT 1');
      checks.database = 'ok';
    } catch {
      checks.database = 'error';
    }

    try {
      const pong = await this.redis.ping();
      checks.redis = pong ? 'ok' : 'error';
    } catch {
      checks.redis = 'error';
    }

    const allOk = Object.values(checks).every((v) => v === 'ok');

    return {
      status: allOk ? 'ok' : 'degraded',
      timestamp: new Date().toISOString(),
      checks,
    };
  }
}
