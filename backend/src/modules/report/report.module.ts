import { Module } from '@nestjs/common';
import { DailyReportService } from './daily-report.service.js';
import { TelegramBotModule } from '../telegram-bot/telegram-bot.module.js';

@Module({
  imports: [TelegramBotModule],
  providers: [DailyReportService],
  exports: [DailyReportService],
})
export class ReportModule {}
