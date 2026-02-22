import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service.js';
import { RedisService } from '../../shared/redis/redis.service.js';

@Injectable()
export class BotUserService {
  private readonly logger = new Logger(BotUserService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
  ) {}

  async findOrCreate(data: {
    telegramId: bigint;
    username?: string;
    firstName?: string;
    lastName?: string;
    languageCode?: string;
    referredBy?: string;
  }) {
    let user = await this.prisma.botUser.findUnique({
      where: { telegramId: data.telegramId },
    });

    if (!user) {
      user = await this.prisma.botUser.create({
        data: {
          telegramId: data.telegramId,
          username: data.username,
          firstName: data.firstName,
          lastName: data.lastName,
          languageCode: data.languageCode,
          referredBy: data.referredBy,
        },
      });
      this.logger.log(`New user created: ${data.telegramId}`);
    } else {
      user = await this.prisma.botUser.update({
        where: { id: user.id },
        data: {
          username: data.username,
          firstName: data.firstName,
          lastName: data.lastName,
          lastActiveAt: new Date(),
        },
      });
    }

    return user;
  }

  async findByTelegramId(telegramId: bigint) {
    return this.prisma.botUser.findUnique({
      where: { telegramId },
      include: { subscriptions: { where: { isActive: true } } },
    });
  }

  async findById(id: number) {
    return this.prisma.botUser.findUnique({ where: { id } });
  }

  async blockUser(telegramId: bigint) {
    return this.prisma.botUser.update({
      where: { telegramId },
      data: { isBlocked: true },
    });
  }

  async unblockUser(telegramId: bigint) {
    return this.prisma.botUser.update({
      where: { telegramId },
      data: { isBlocked: false },
    });
  }

  async getStats() {
    const [total, active, blocked] = await Promise.all([
      this.prisma.botUser.count(),
      this.prisma.botUser.count({
        where: {
          lastActiveAt: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
        },
      }),
      this.prisma.botUser.count({ where: { isBlocked: true } }),
    ]);

    return { total, active, blocked };
  }

  async findAll(params: {
    page?: number;
    limit?: number;
    search?: string;
    isBlocked?: boolean;
  }) {
    const { page = 1, limit = 20, search, isBlocked } = params;
    const skip = (page - 1) * limit;

    const where: any = {};
    if (isBlocked !== undefined) where.isBlocked = isBlocked;
    if (search) {
      where.OR = [
        { username: { contains: search, mode: 'insensitive' } },
        { firstName: { contains: search, mode: 'insensitive' } },
        { phone: { contains: search } },
      ];
    }

    const [data, total] = await Promise.all([
      this.prisma.botUser.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: { subscriptions: { where: { isActive: true }, take: 1 } },
      }),
      this.prisma.botUser.count({ where }),
    ]);

    return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
  }
}
