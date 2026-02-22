import { Injectable, Logger } from '@nestjs/common';
import { TelegramSessionService } from './telegram-session.service.js';
import { MessageQueueService } from './message-queue.service.js';
import { DeduplicationService } from './deduplication.service.js';

export interface RawMessage {
  messageId: number;
  chatId: bigint;
  senderId?: bigint;
  senderName?: string;
  text?: string;
  isForwarded: boolean;
  groupTitle?: string;
  sessionId: number;
}

@Injectable()
export class UpdateFetcherService {
  private readonly logger = new Logger(UpdateFetcherService.name);
  private pollingIntervals: NodeJS.Timeout[] = [];

  constructor(
    private readonly sessionService: TelegramSessionService,
    private readonly messageQueue: MessageQueueService,
    private readonly dedup: DeduplicationService,
  ) {}

  async startRealTimeListener(sessionId: number, client: any) {
    this.logger.log(`Starting real-time listener for session ${sessionId}`);

    // GramJS NewMessage event handler would be registered here
    // client.addEventHandler(handler, new NewMessage({}))
  }

  async startPolling(sessionId: number, client: any) {
    const isMulti = this.sessionService.isMultiSession();
    const intervalMs = isMulti ? 3000 : 2000;

    this.logger.log(`Starting polling for session ${sessionId}, interval=${intervalMs}ms`);

    const interval = setInterval(async () => {
      try {
        await this.pollUpdates(sessionId, client);
      } catch (err) {
        this.logger.error(`Polling error on session ${sessionId}`, err);
      }
    }, intervalMs);

    this.pollingIntervals.push(interval);
  }

  private async pollUpdates(sessionId: number, _client: any) {
    // GramJS GetDifference call would go here
    // const updates = await client.invoke(new Api.updates.GetDifference(...));
    // Process new messages and add to queue
  }

  async processRawMessage(message: RawMessage) {
    // Check deduplication
    const isDuplicate = this.dedup.checkAndAdd(message.messageId, message.chatId);
    if (isDuplicate) return;

    // Add to processing queue
    this.messageQueue.enqueue(message);
  }

  stopAll() {
    for (const interval of this.pollingIntervals) {
      clearInterval(interval);
    }
    this.pollingIntervals = [];
  }
}
