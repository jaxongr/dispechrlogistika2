import { Module } from '@nestjs/common';
import { TelegramSessionService } from './telegram-session.service.js';
import { MultiSessionService } from './multi-session.service.js';
import { GroupAssignmentService } from './group-assignment.service.js';
import { UpdateFetcherService } from './update-fetcher.service.js';
import { MessageQueueService } from './message-queue.service.js';
import { DeduplicationService } from './deduplication.service.js';

@Module({
  providers: [
    TelegramSessionService,
    MultiSessionService,
    GroupAssignmentService,
    UpdateFetcherService,
    MessageQueueService,
    DeduplicationService,
  ],
  exports: [
    MultiSessionService,
    MessageQueueService,
    GroupAssignmentService,
    DeduplicationService,
  ],
})
export class TelegramMonitorModule {}
