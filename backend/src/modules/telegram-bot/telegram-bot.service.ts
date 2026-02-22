import { Injectable, Logger, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Telegraf, Context } from 'telegraf';
import { TelegramBotCommands } from './telegram-bot.commands.js';
import { TelegramBotHandlers } from './telegram-bot.handlers.js';
import { TelegramBotProtection } from './telegram-bot.protection.js';
import { BotUserService } from '../bot-user/bot-user.service.js';

@Injectable()
export class TelegramBotService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(TelegramBotService.name);
  private bot: Telegraf;

  constructor(
    private readonly config: ConfigService,
    private readonly commands: TelegramBotCommands,
    private readonly handlers: TelegramBotHandlers,
    private readonly protection: TelegramBotProtection,
    private readonly botUserService: BotUserService,
  ) {}

  getBot(): Telegraf {
    return this.bot;
  }

  async onModuleInit() {
    const token = this.config.get<string>('TELEGRAM_BOT_TOKEN');
    if (!token || token === 'placeholder') {
      this.logger.warn('TELEGRAM_BOT_TOKEN not set, bot will not start');
      return;
    }

    this.bot = new Telegraf(token);

    // Middleware: user loading
    this.bot.use(async (ctx: Context, next) => {
      if (ctx.from) {
        try {
          await this.botUserService.findOrCreate({
            telegramId: BigInt(ctx.from.id),
            username: ctx.from.username,
            firstName: ctx.from.first_name,
            lastName: ctx.from.last_name,
            languageCode: ctx.from.language_code,
          });
        } catch (err) {
          this.logger.error('User middleware error', err);
        }
      }
      return next();
    });

    // Register commands
    this.commands.register(this.bot);
    this.handlers.register(this.bot);
    this.protection.register(this.bot);

    try {
      await this.bot.launch();
      this.logger.log('Telegram bot launched successfully');
    } catch (err) {
      this.logger.error('Failed to launch bot', err);
    }
  }

  async onModuleDestroy() {
    if (this.bot) {
      this.bot.stop('Application shutdown');
      this.logger.log('Telegram bot stopped');
    }
  }

  async sendMessage(chatId: string | number, text: string, extra?: any) {
    if (!this.bot) return;
    try {
      return await this.bot.telegram.sendMessage(chatId, text, {
        parse_mode: 'HTML',
        ...extra,
      });
    } catch (err) {
      this.logger.error(`Failed to send message to ${chatId}`, err);
    }
  }

  async deleteMessage(chatId: string | number, messageId: number) {
    if (!this.bot) return;
    try {
      await this.bot.telegram.deleteMessage(chatId, messageId);
    } catch (err) {
      this.logger.error(`Failed to delete message ${messageId}`, err);
    }
  }
}
