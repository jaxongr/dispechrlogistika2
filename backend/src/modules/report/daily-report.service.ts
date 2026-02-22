import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { PrismaService } from '../../prisma/prisma.service.js';
import { TelegramBotService } from '../telegram-bot/telegram-bot.service.js';
import { ConfigService } from '@nestjs/config';
import {
  startOfDayTashkent,
  endOfDayTashkent,
  formatTashkent,
  tashkentMidnightCron,
} from '../../common/constants/timezone.js';

@Injectable()
export class DailyReportService {
  private readonly logger = new Logger(DailyReportService.name);
  private readonly reportGroupId: string;

  constructor(
    private readonly prisma: PrismaService,
    private readonly botService: TelegramBotService,
    private readonly config: ConfigService,
  ) {
    this.reportGroupId = this.config.get<string>('REPORT_GROUP_ID', '-1003303026585');
  }

  // 00:05 Tashkent = 19:05 UTC
  @Cron('5 19 * * *')
  async generateDailyReport() {
    try {
      const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);
      const dayStart = startOfDayTashkent(yesterday);
      const dayEnd = endOfDayTashkent(yesterday);

      const [
        totalMessages,
        filteredMessages,
        postedMessages,
        blockedUsers,
        aiBlocked,
        newUsers,
        activeUsers,
        revenue,
      ] = await Promise.all([
        this.prisma.message.count({
          where: { createdAt: { gte: dayStart, lte: dayEnd } },
        }),
        this.prisma.message.count({
          where: { createdAt: { gte: dayStart, lte: dayEnd }, isFiltered: true },
        }),
        this.prisma.message.count({
          where: { createdAt: { gte: dayStart, lte: dayEnd }, isPosted: true },
        }),
        this.prisma.blockedUser.count({
          where: { createdAt: { gte: dayStart, lte: dayEnd } },
        }),
        this.prisma.aIBlockedUser.count({
          where: { createdAt: { gte: dayStart, lte: dayEnd } },
        }),
        this.prisma.botUser.count({
          where: { createdAt: { gte: dayStart, lte: dayEnd } },
        }),
        this.prisma.botUser.count({
          where: { lastActiveAt: { gte: dayStart, lte: dayEnd } },
        }),
        this.prisma.payment.aggregate({
          where: {
            createdAt: { gte: dayStart, lte: dayEnd },
            status: 'COMPLETED',
          },
          _sum: { amount: true },
        }),
      ]);

      const revenueAmount = revenue._sum.amount || 0;

      // Save report
      await this.prisma.dispatcherReport.upsert({
        where: { reportDate: dayStart },
        update: {
          totalMessages,
          filteredMessages,
          postedMessages,
          blockedUsers,
          aiBlocked,
          newUsers,
          activeUsers,
          revenue: revenueAmount,
        },
        create: {
          reportDate: dayStart,
          totalMessages,
          filteredMessages,
          postedMessages,
          blockedUsers,
          aiBlocked,
          newUsers,
          activeUsers,
          revenue: revenueAmount,
        },
      });

      // Format and send report
      const dateStr = formatTashkent(yesterday);
      const passRate = totalMessages > 0
        ? ((postedMessages / totalMessages) * 100).toFixed(1)
        : '0';

      const html =
        `📊 <b>Kunlik hisobot</b> — ${dateStr}\n\n` +
        `📨 Jami xabarlar: <b>${totalMessages.toLocaleString()}</b>\n` +
        `🚫 Filtrlangan: <b>${filteredMessages.toLocaleString()}</b>\n` +
        `✅ E'lon qilingan: <b>${postedMessages.toLocaleString()}</b> (${passRate}%)\n\n` +
        `🔒 Bloklangan: <b>${blockedUsers}</b>\n` +
        `🤖 AI bloklangan: <b>${aiBlocked}</b>\n\n` +
        `👥 Yangi foydalanuvchilar: <b>${newUsers}</b>\n` +
        `📱 Faol foydalanuvchilar: <b>${activeUsers}</b>\n\n` +
        `💰 Daromad: <b>${revenueAmount.toLocaleString()} UZS</b>`;

      await this.botService.sendMessage(this.reportGroupId, html);

      this.logger.log(`Daily report sent for ${dateStr}`);
    } catch (err) {
      this.logger.error('Failed to generate daily report', err);
    }
  }

  async getReports(params: { page?: number; limit?: number }) {
    const { page = 1, limit = 30 } = params;
    const skip = (page - 1) * limit;

    const [data, total] = await Promise.all([
      this.prisma.dispatcherReport.findMany({
        skip,
        take: limit,
        orderBy: { reportDate: 'desc' },
      }),
      this.prisma.dispatcherReport.count(),
    ]);

    return { data, total, page, limit };
  }
}
