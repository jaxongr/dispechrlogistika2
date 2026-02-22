import { Injectable, Logger } from '@nestjs/common';
import { Telegraf, Context, Markup } from 'telegraf';
import { BotUserService } from '../bot-user/bot-user.service.js';

@Injectable()
export class TelegramBotCommands {
  private readonly logger = new Logger(TelegramBotCommands.name);

  constructor(private readonly botUserService: BotUserService) {}

  register(bot: Telegraf) {
    bot.start(async (ctx) => this.handleStart(ctx));
    bot.help(async (ctx) => this.handleHelp(ctx));
  }

  private async handleStart(ctx: Context) {
    try {
      const telegramId = BigInt(ctx.from!.id);
      const startPayload = (ctx as any).startPayload as string | undefined;
      let referredBy: string | undefined;

      // Check referral: ?start=ref_CODE
      if (startPayload?.startsWith('ref_')) {
        referredBy = startPayload.substring(4);
      }

      const user = await this.botUserService.findOrCreate({
        telegramId,
        username: ctx.from!.username,
        firstName: ctx.from!.first_name,
        lastName: ctx.from!.last_name,
        languageCode: ctx.from!.language_code,
        referredBy,
      });

      const greeting = user.firstName || ctx.from!.first_name || 'Foydalanuvchi';

      await ctx.reply(
        `Assalomu alaykum, <b>${this.escapeHtml(greeting)}</b>! 🚛\n\n` +
          `<b>Dispatchr Logistics</b> — O'zbekiston bo'ylab yuk tashish e'lonlari.\n\n` +
          `Quyidagi menyu orqali boshqaring:`,
        {
          parse_mode: 'HTML',
          ...this.getMainMenuKeyboard(),
        },
      );
    } catch (err) {
      this.logger.error('Start command error', err);
      await ctx.reply('Xatolik yuz berdi. Qayta urinib ko\'ring.');
    }
  }

  private async handleHelp(ctx: Context) {
    await ctx.reply(
      `<b>Yordam</b>\n\n` +
        `📢 <b>E'lonlar</b> — So'nggi yuk tashish e'lonlari\n` +
        `💳 <b>Obuna</b> — Obuna rejalarini ko'rish\n` +
        `👤 <b>Profil</b> — Shaxsiy ma'lumotlar\n` +
        `🎁 <b>Referral</b> — Do'stlarni taklif qilish\n\n` +
        `Muammo bo'lsa: /start buyrug'ini yuboring.`,
      { parse_mode: 'HTML' },
    );
  }

  getMainMenuKeyboard() {
    return Markup.keyboard([
      ['📢 E\'lonlar', '🔍 Qidirish'],
      ['💳 Obuna bo\'lish', '👤 Profil'],
      ['🎁 Referral', '📞 Aloqa'],
    ]).resize();
  }

  private escapeHtml(text: string): string {
    return text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }
}
