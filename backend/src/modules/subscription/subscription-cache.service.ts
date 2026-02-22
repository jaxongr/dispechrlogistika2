import { Injectable } from '@nestjs/common';
import { RedisService } from '../../shared/redis/redis.service.js';
import {
  SUBSCRIPTION_CACHE_PREFIX,
  SUBSCRIPTION_CACHE_TTL,
} from '../../common/constants/app.constants.js';

@Injectable()
export class SubscriptionCacheService {
  constructor(private readonly redis: RedisService) {}

  async get(telegramId: bigint): Promise<boolean | null> {
    const cached = await this.redis.get(`${SUBSCRIPTION_CACHE_PREFIX}${telegramId}`);
    if (cached === null) return null;
    return cached === '1';
  }

  async set(telegramId: bigint, isActive: boolean): Promise<void> {
    await this.redis.set(
      `${SUBSCRIPTION_CACHE_PREFIX}${telegramId}`,
      isActive ? '1' : '0',
      SUBSCRIPTION_CACHE_TTL,
    );
  }

  async invalidate(telegramId: bigint): Promise<void> {
    await this.redis.del(`${SUBSCRIPTION_CACHE_PREFIX}${telegramId}`);
  }
}
