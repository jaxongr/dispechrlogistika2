import { Module } from '@nestjs/common';
import { BotUserService } from './bot-user.service.js';
import { BotUserController } from './bot-user.controller.js';

@Module({
  providers: [BotUserService],
  controllers: [BotUserController],
  exports: [BotUserService],
})
export class BotUserModule {}
