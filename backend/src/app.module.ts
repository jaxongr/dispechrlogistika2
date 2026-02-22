import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { ThrottlerModule } from '@nestjs/throttler';
import { PrismaModule } from './prisma/prisma.module.js';
import { RedisModule } from './shared/redis/redis.module.js';
import { HealthModule } from './health/health.module.js';
import { AuthModule } from './modules/auth/auth.module.js';
import { BotUserModule } from './modules/bot-user/bot-user.module.js';
import { TelegramBotModule } from './modules/telegram-bot/telegram-bot.module.js';
import { SubscriptionModule } from './modules/subscription/subscription.module.js';
import { PaymentModule } from './modules/payment/payment.module.js';
import { TelegramMonitorModule } from './modules/telegram-monitor/telegram-monitor.module.js';
import { MessageFilterModule } from './modules/message-filter/message-filter.module.js';
import { AutoBlockerModule } from './modules/auto-blocker/auto-blocker.module.js';
import { ReferralModule } from './modules/referral/referral.module.js';
import { ReportModule } from './modules/report/report.module.js';
import { WebsocketModule } from './modules/websocket/websocket.module.js';
import {
  databaseConfig,
  redisConfig,
  telegramConfig,
  paymentConfig,
  validate,
} from './config/index.js';

@Module({
  imports: [
    // Configuration
    ConfigModule.forRoot({
      isGlobal: true,
      load: [databaseConfig, redisConfig, telegramConfig, paymentConfig],
      validate,
      envFilePath: '.env',
    }),

    // Rate limiting
    ThrottlerModule.forRoot([
      {
        ttl: 60000,
        limit: 100,
      },
    ]),

    // Scheduled tasks
    ScheduleModule.forRoot(),

    // Core modules
    PrismaModule,
    RedisModule,
    HealthModule,

    // Feature modules
    AuthModule,
    BotUserModule,
    TelegramBotModule,
    SubscriptionModule,
    PaymentModule,
    TelegramMonitorModule,
    MessageFilterModule,
    AutoBlockerModule,
    ReferralModule,
    ReportModule,
    WebsocketModule,
  ],
})
export class AppModule {}
