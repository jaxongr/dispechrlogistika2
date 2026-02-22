import { Module } from '@nestjs/common';
import { TelegramBotService } from './telegram-bot.service.js';
import { TelegramBotCommands } from './telegram-bot.commands.js';
import { TelegramBotHandlers } from './telegram-bot.handlers.js';
import { TelegramBotChannel } from './telegram-bot.channel.js';
import { TelegramBotProtection } from './telegram-bot.protection.js';
import { BotUserModule } from '../bot-user/bot-user.module.js';
import { AuthModule } from '../auth/auth.module.js';

@Module({
  imports: [BotUserModule, AuthModule],
  providers: [
    TelegramBotService,
    TelegramBotCommands,
    TelegramBotHandlers,
    TelegramBotChannel,
    TelegramBotProtection,
  ],
  exports: [TelegramBotService, TelegramBotChannel],
})
export class TelegramBotModule {}
