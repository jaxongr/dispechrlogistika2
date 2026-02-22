import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service.js';
import { TelegramSessionService } from './telegram-session.service.js';

export interface GroupAssignment {
  chatId: bigint;
  sessionId: number;
  isPriority: boolean;
}

@Injectable()
export class GroupAssignmentService {
  private readonly logger = new Logger(GroupAssignmentService.name);
  private assignments: Map<string, GroupAssignment> = new Map();

  constructor(
    private readonly prisma: PrismaService,
    private readonly sessionService: TelegramSessionService,
  ) {}

  async loadAssignments() {
    const groups = await this.prisma.telegramGroup.findMany({
      where: { isActive: true },
    });

    this.assignments.clear();

    for (const group of groups) {
      this.assignments.set(String(group.chatId), {
        chatId: group.chatId,
        sessionId: group.sessionId || 1,
        isPriority: group.isPriority,
      });
    }

    this.logger.log(`Loaded ${this.assignments.size} group assignments`);
  }

  getSessionForGroup(chatId: bigint): number {
    const assignment = this.assignments.get(String(chatId));
    return assignment?.sessionId || 1;
  }

  isPriorityGroup(chatId: bigint): boolean {
    const assignment = this.assignments.get(String(chatId));
    return assignment?.isPriority || false;
  }

  getPriorityGroups(): GroupAssignment[] {
    return Array.from(this.assignments.values()).filter((g) => g.isPriority);
  }

  getGroupsForSession(sessionId: number): GroupAssignment[] {
    const groups = Array.from(this.assignments.values()).filter(
      (g) => g.sessionId === sessionId,
    );

    // Priority groups monitored by all sessions
    const priorityGroups = this.getPriorityGroups().filter(
      (g) => g.sessionId !== sessionId,
    );

    return [...groups, ...priorityGroups];
  }

  async assignGroupToSession(chatId: bigint, sessionId: number) {
    await this.prisma.telegramGroup.upsert({
      where: { chatId },
      update: { sessionId },
      create: {
        chatId,
        sessionId,
        isActive: true,
      },
    });

    this.assignments.set(String(chatId), {
      chatId,
      sessionId,
      isPriority: this.isPriorityGroup(chatId),
    });
  }

  getStats() {
    const totalGroups = this.assignments.size;
    const priorityGroups = this.getPriorityGroups().length;
    const sessionCount = this.sessionService.getSessionCount();

    const groupsPerSession: Record<number, number> = {};
    for (let i = 1; i <= sessionCount; i++) {
      groupsPerSession[i] = this.getGroupsForSession(i).length;
    }

    return { totalGroups, priorityGroups, groupsPerSession };
  }
}
