import { Injectable, Logger, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { TelegramSessionService } from './telegram-session.service.js';
import { QUEUE_OVERFLOW_LIMIT } from '../../common/constants/app.constants.js';
import type { RawMessage } from './update-fetcher.service.js';

@Injectable()
export class MessageQueueService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(MessageQueueService.name);
  private readonly queue: RawMessage[] = [];
  private workers: NodeJS.Timeout[] = [];
  private readonly handlers: Array<(message: RawMessage) => Promise<void>> = [];

  constructor(private readonly sessionService: TelegramSessionService) {}

  onModuleInit() {
    this.startWorkers();
  }

  onModuleDestroy() {
    this.stopWorkers();
  }

  private startWorkers() {
    const isMulti = this.sessionService.isMultiSession();
    const workerCount = isMulti ? 5 : 3;
    const batchSize = isMulti ? 20 : 50;
    const workerInterval = 1000; // 1 second per worker
    const startOffset = isMulti ? 100 : 50;

    for (let i = 0; i < workerCount; i++) {
      const timeout = setTimeout(() => {
        const interval = setInterval(() => {
          this.processNextBatch(batchSize);
        }, workerInterval);
        this.workers.push(interval);
      }, i * startOffset);
      this.workers.push(timeout);
    }

    this.logger.log(`Started ${workerCount} queue workers`);
  }

  private stopWorkers() {
    for (const worker of this.workers) {
      clearInterval(worker);
      clearTimeout(worker);
    }
    this.workers = [];
  }

  enqueue(message: RawMessage) {
    // Queue overflow: drop oldest
    if (this.queue.length > QUEUE_OVERFLOW_LIMIT) {
      const dropped = this.queue.length - QUEUE_OVERFLOW_LIMIT;
      this.queue.splice(0, dropped);
      this.logger.warn(`Queue overflow: dropped ${dropped} oldest messages`);
    }

    this.queue.push(message);
  }

  private async processNextBatch(batchSize: number) {
    if (this.queue.length === 0) return;

    const batch = this.queue.splice(0, batchSize);

    for (const message of batch) {
      for (const handler of this.handlers) {
        try {
          await handler(message);
        } catch (err) {
          this.logger.error(`Handler error for message ${message.messageId}`, err);
        }
      }
    }
  }

  onMessage(handler: (message: RawMessage) => Promise<void>) {
    this.handlers.push(handler);
  }

  getQueueSize(): number {
    return this.queue.length;
  }

  getStats() {
    return {
      queueSize: this.queue.length,
      workerCount: this.workers.length,
      handlerCount: this.handlers.length,
    };
  }
}
