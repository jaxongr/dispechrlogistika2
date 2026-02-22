import { Injectable, Logger } from '@nestjs/common';
import { Telegraf, Context } from 'telegraf';
import { BotUserService } from '../bot-user/bot-user.service.js';
import { PrismaService } from '../../prisma/prisma.service.js';

@Injectable()
export class TelegramBotHandlers {
  private readonly logger = new Logger(TelegramBotHandlers.name);

  constructor(
    private readonly botUserService: BotUserService,
    private readonly prisma: PrismaService,
  ) {}

  register(bot: Telegraf) {
    // Text handlers
    bot.hears('📢 E\'lonlar', (ctx) => this.handleAnnouncements(ctx));
    bot.hears('💳 Obuna bo\'lish', (ctx) => this.handleSubscription(ctx));
    bot.hears('👤 Profil', (ctx) => this.handleProfile(ctx));
    bot.hears('🎁 Referral', (ctx) => this.handleReferral(ctx));
    bot.hears('📞 Aloqa', (ctx) => this.handleContact(ctx));
    bot.hears('🔍 Qidirish', (ctx) => this.handleSearch(ctx));

    // Callback queries
    bot.on('callback_query', (ctx) => this.handleCallbackQuery(ctx));
  }

  private async handleAnnouncements(ctx: Context) {
    const telegramId = BigInt(ctx.from!.id);
    const user = await this.botUserService.findByTelegramId(telegramId);

    if (!user?.subscriptions?.length) {
      await ctx.reply(
        '⚠️ E\'lonlarni ko\'rish uchun obuna bo\'lishingiz kerak.\n\n' +
          '💳 <b>Obuna bo\'lish</b> tugmasini bosing.',
        { parse_mode: 'HTML' },
      );
      return;
    }

    await ctx.reply(
      '📢 <b>So\'nggi e\'lonlar</b>\n\n' +
        'Yangi e\'lonlar avtomatik ravishda kanalga yuboriladi.\n' +
        'Obuna davomida barcha e\'lonlarni ko\'rishingiz mumkin.',
      { parse_mode: 'HTML' },
    );
  }

  private async handleSubscription(ctx: Context) {
    const telegramId = BigInt(ctx.from!.id);
    const user = await this.botUserService.findByTelegramId(telegramId);
    const activeSub = user?.subscriptions?.[0];

    let text: string;
    if (activeSub) {
      const endDate = activeSub.endDate.toLocaleDateString('ru-RU');
      text =
        `✅ <b>Sizning obunangiz faol</b>\n\n` +
        `📋 Reja: <b>${activeSub.planType}</b>\n` +
        `📅 Tugash: <b>${endDate}</b>`;
    } else {
      text =
        `💳 <b>Obuna rejalari</b>\n\n` +
        `🆓 Trial — 12 soat (bepul, 1 marta)\n` +
        `📅 Kunlik — 5,000 UZS\n` +
        `📅 Haftalik — 25,000 UZS\n` +
        `📅 Oylik — 70,000 UZS\n\n` +
        `Tanlang:`;
    }

    await ctx.reply(text, {
      parse_mode: 'HTML',
      reply_markup: {
        inline_keyboard: [
          [
            { text: '🆓 Trial (12 soat)', callback_data: 'sub:trial' },
          ],
          [
            { text: '📅 Kunlik — 5,000', callback_data: 'sub:daily' },
            { text: '📅 Haftalik — 25,000', callback_data: 'sub:weekly' },
          ],
          [
            { text: '📅 Oylik — 70,000', callback_data: 'sub:monthly' },
          ],
        ],
      },
    });
  }

  private async handleProfile(ctx: Context) {
    const telegramId = BigInt(ctx.from!.id);
    const user = await this.botUserService.findByTelegramId(telegramId);

    if (!user) {
      await ctx.reply('Foydalanuvchi topilmadi. /start buyrug\'ini yuboring.');
      return;
    }

    const activeSub = user.subscriptions?.[0];
    const subStatus = activeSub
      ? `✅ ${activeSub.planType} (${activeSub.endDate.toLocaleDateString('ru-RU')} gacha)`
      : '❌ Obuna yo\'q';

    await ctx.reply(
      `👤 <b>Profil</b>\n\n` +
        `🆔 ID: <code>${user.telegramId}</code>\n` +
        `👤 Ism: ${user.firstName || '—'} ${user.lastName || ''}\n` +
        `📱 Username: ${user.username ? '@' + user.username : '—'}\n` +
        `📋 Obuna: ${subStatus}\n` +
        `📅 Ro'yxatdan: ${user.createdAt.toLocaleDateString('ru-RU')}`,
      { parse_mode: 'HTML' },
    );
  }

  private async handleReferral(ctx: Context) {
    const telegramId = ctx.from!.id;
    const botUsername = (ctx as any).botInfo?.username || 'dispatchr_bot';

    await ctx.reply(
      `🎁 <b>Referral dasturi</b>\n\n` +
        `Do'stlaringizni taklif qiling va cashback oling!\n\n` +
        `📎 Sizning havolangiz:\n` +
        `<code>https://t.me/${botUsername}?start=ref_${telegramId}</code>\n\n` +
        `💰 Har bir to'lovdan <b>50%</b> cashback (birinchi to'lov).`,
      { parse_mode: 'HTML' },
    );
  }

  private async handleContact(ctx: Context) {
    await ctx.reply(
      `📞 <b>Aloqa</b>\n\n` +
        `Savollar yoki muammolar bo'lsa:\n` +
        `📩 Admin: @dispatchr_admin\n` +
        `📧 Email: support@dispatchr.uz`,
      { parse_mode: 'HTML' },
    );
  }

  private async handleSearch(ctx: Context) {
    await ctx.reply(
      '🔍 <b>Qidirish</b>\n\nQidirmoqchi bo\'lgan yo\'nalishni yozing (masalan: Toshkent - Samarqand):',
      { parse_mode: 'HTML' },
    );
  }

  private async handleCallbackQuery(ctx: Context) {
    const data = (ctx.callbackQuery as any)?.data;
    if (!data) return;

    if (data.startsWith('sub:')) {
      const planType = data.split(':')[1];
      await ctx.answerCbQuery();
      await ctx.reply(
        `💳 <b>${planType.toUpperCase()}</b> rejasi tanlandi.\n\n` +
          `To'lov usulini tanlang:`,
        {
          parse_mode: 'HTML',
          reply_markup: {
            inline_keyboard: [
              [
                { text: '💳 Click', callback_data: `pay:click:${planType}` },
                { text: '💳 Payme', callback_data: `pay:payme:${planType}` },
              ],
            ],
          },
        },
      );
    }

    if (data.startsWith('pay:')) {
      await ctx.answerCbQuery('To\'lov havolasi tayyorlanmoqda...');
    }
  }
}
