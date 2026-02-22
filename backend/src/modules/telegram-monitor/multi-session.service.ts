import { Injectable, Logger, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { TelegramSessionService } from './telegram-session.service.js';
import { GroupAssignmentService } from './group-assignment.service.js';

@Injectable()
export class MultiSessionService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(MultiSessionService.name);
  private readonly clients: Map<number, any> = new Map();

  constructor(
    private readonly sessionService: TelegramSessionService,
    private readonly groupAssignment: GroupAssignmentService,
  ) {}

  async onModuleInit() {
    const sessions = this.sessionService.getAllSessions();

    if (sessions.length === 0) {
      this.logger.warn('No GramJS sessions configured, monitor will not start');
      return;
    }

    for (const session of sessions) {
      try {
        await this.connectSession(session.id);
      } catch (err) {
        this.logger.error(`Failed to connect session ${session.id}`, err);
      }
    }

    this.logger.log(`Connected ${this.clients.size}/${sessions.length} sessions`);
  }

  private async connectSession(sessionId: number) {
    const session = this.sessionService.getSession(sessionId);
    if (!session) return;

    // GramJS client creation would go here when session strings are configured
    // For now, mark session as ready to connect
    this.logger.log(`Session ${sessionId} ready for connection`);
    this.sessionService.updateConnectionStatus(sessionId, false);
  }

  async onModuleDestroy() {
    for (const [id, client] of this.clients) {
      try {
        if (client?.disconnect) {
          await client.disconnect();
        }
        this.logger.log(`Session ${id} disconnected`);
      } catch (err) {
        this.logger.error(`Error disconnecting session ${id}`, err);
      }
    }
    this.clients.clear();
  }

  getClient(sessionId: number): any {
    return this.clients.get(sessionId);
  }

  getConnectedClients(): Map<number, any> {
    return new Map(
      Array.from(this.clients.entries()).filter(
        ([id]) => this.sessionService.getSession(id)?.isConnected,
      ),
    );
  }

  getStatus() {
    return this.sessionService.getStatus();
  }
}
