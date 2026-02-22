import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service.js';
import { MAX_VIP_USERS } from '../../common/constants/app.constants.js';

@Injectable()
export class VipUserService {
  private readonly logger = new Logger(VipUserService.name);

  constructor(private readonly prisma: PrismaService) {}

  async createVipUser(userId: number, telegramId: bigint): Promise<any> {
    // Check VIP limit
    const currentCount = await this.prisma.vipUser.count({ where: { isActive: true } });
    if (currentCount >= MAX_VIP_USERS) {
      throw new BadRequestException(`VIP limit reached: ${MAX_VIP_USERS}`);
    }

    // Generate VIP code: VIP0001-VIP1000
    const nextNumber = currentCount + 1;
    const vipCode = `VIP${String(nextNumber).padStart(4, '0')}`;

    const vipUser = await this.prisma.vipUser.create({
      data: {
        userId,
        telegramId,
        vipCode,
        isActive: true,
      },
    });

    this.logger.log(`VIP user created: ${vipCode} for user ${telegramId}`);
    return vipUser;
  }

  async findByTelegramId(telegramId: bigint) {
    return this.prisma.vipUser.findUnique({
      where: { telegramId },
      include: { referrals: true, earnings: true },
    });
  }

  async suspendVip(telegramId: bigint) {
    return this.prisma.vipUser.update({
      where: { telegramId },
      data: { isActive: false, suspendedAt: new Date() },
    });
  }

  async reactivateVip(telegramId: bigint) {
    return this.prisma.vipUser.update({
      where: { telegramId },
      data: { isActive: true, suspendedAt: null },
    });
  }

  async getStats() {
    const [total, active, suspended, totalEarnings] = await Promise.all([
      this.prisma.vipUser.count(),
      this.prisma.vipUser.count({ where: { isActive: true } }),
      this.prisma.vipUser.count({ where: { isActive: false } }),
      this.prisma.vipUser.aggregate({ _sum: { totalEarnings: true } }),
    ]);

    return {
      total,
      active,
      suspended,
      remaining: MAX_VIP_USERS - active,
      totalEarnings: totalEarnings._sum.totalEarnings || 0,
    };
  }

  async findAll(params: { page?: number; limit?: number; isActive?: boolean }) {
    const { page = 1, limit = 20, isActive } = params;
    const skip = (page - 1) * limit;
    const where: any = {};
    if (isActive !== undefined) where.isActive = isActive;

    const [data, total] = await Promise.all([
      this.prisma.vipUser.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: { user: { select: { firstName: true, username: true, telegramId: true } } },
      }),
      this.prisma.vipUser.count({ where }),
    ]);

    return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
  }
}
