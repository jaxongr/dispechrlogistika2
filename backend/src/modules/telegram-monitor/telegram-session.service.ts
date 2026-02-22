import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

export interface SessionInfo {
  id: number;
  sessionString: string;
  isConnected: boolean;
  groupCount: number;
}

@Injectable()
export class TelegramSessionService {
  private readonly logger = new Logger(TelegramSessionService.name);
  private readonly sessions: Map<number, SessionInfo> = new Map();
  private readonly apiId: number;
  private readonly apiHash: string;

  constructor(private readonly config: ConfigService) {
    this.apiId = this.config.get<number>('TELEGRAM_API_ID', 0);
    this.apiHash = this.config.get<string>('TELEGRAM_API_HASH', '');
    this.initSessions();
  }

  private initSessions() {
    const sessionKeys = [
      'TELEGRAM_SESSION_STRING',
      'TELEGRAM_SESSION_STRING_2',
      'TELEGRAM_SESSION_STRING_3',
      'TELEGRAM_SESSION_STRING_4',
      'TELEGRAM_SESSION_STRING_5',
    ];

    sessionKeys.forEach((key, index) => {
      const sessionString = this.config.get<string>(key, '');
      if (sessionString) {
        this.sessions.set(index + 1, {
          id: index + 1,
          sessionString,
          isConnected: false,
          groupCount: 0,
        });
      }
    });

    this.logger.log(`Initialized ${this.sessions.size} session(s)`);
  }

  getSessionCount(): number {
    return this.sessions.size;
  }

  isMultiSession(): boolean {
    return this.sessions.size > 1;
  }

  getSession(id: number): SessionInfo | undefined {
    return this.sessions.get(id);
  }

  getAllSessions(): SessionInfo[] {
    return Array.from(this.sessions.values());
  }

  updateConnectionStatus(id: number, isConnected: boolean) {
    const session = this.sessions.get(id);
    if (session) {
      session.isConnected = isConnected;
    }
  }

  updateGroupCount(id: number, count: number) {
    const session = this.sessions.get(id);
    if (session) {
      session.groupCount = count;
    }
  }

  getApiCredentials() {
    return { apiId: this.apiId, apiHash: this.apiHash };
  }

  getStatus() {
    return {
      totalSessions: this.sessions.size,
      connectedSessions: Array.from(this.sessions.values()).filter((s) => s.isConnected).length,
      sessions: Array.from(this.sessions.values()).map((s) => ({
        id: s.id,
        isConnected: s.isConnected,
        groupCount: s.groupCount,
      })),
    };
  }
}
