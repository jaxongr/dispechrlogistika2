import { Injectable, Logger, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service.js';
import {
  DEDUP_CLEANUP_INTERVAL_MS,
  DEDUP_WINDOW_MS,
} from '../../common/constants/app.constants.js';

@Injectable()
export class DeduplicationService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(DeduplicationService.name);
  // In-memory Set: `msgId_chatId`
  private readonly seen: Set<string> = new Set();
  private cleanupInterval: NodeJS.Timeout;

  constructor(private readonly prisma: PrismaService) {}

  onModuleInit() {
    // Clean in-memory set every 10 minutes
    this.cleanupInterval = setInterval(() => {
      const sizeBefore = this.seen.size;
      this.seen.clear();
      if (sizeBefore > 0) {
        this.logger.log(`Cleared dedup set: ${sizeBefore} entries`);
      }
    }, DEDUP_CLEANUP_INTERVAL_MS);
  }

  onModuleDestroy() {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
    }
  }

  /**
   * In-memory deduplication check
   * Returns true if duplicate
   */
  checkAndAdd(messageId: number, chatId: bigint): boolean {
    const key = `${messageId}_${chatId}`;
    if (this.seen.has(key)) return true;
    this.seen.add(key);
    return false;
  }

  /**
   * DB-level deduplication: check for same text within 10 minutes
   */
  async isDuplicateText(
    senderId: bigint,
    textHash: string,
    windowMs: number = DEDUP_WINDOW_MS,
  ): Promise<boolean> {
    const since = new Date(Date.now() - windowMs);

    const existing = await this.prisma.message.findFirst({
      where: {
        senderId,
        textHash,
        createdAt: { gte: since },
      },
    });

    return !!existing;
  }

  getStats() {
    return {
      memorySetSize: this.seen.size,
    };
  }
}
