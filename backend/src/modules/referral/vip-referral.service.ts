import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service.js';
import { VipCodeStatus } from '@prisma/client';

@Injectable()
export class VipReferralService {
  private readonly logger = new Logger(VipReferralService.name);

  constructor(private readonly prisma: PrismaService) {}

  async generateCode(vipUserId: number): Promise<string> {
    const vipUser = await this.prisma.vipUser.findUnique({ where: { id: vipUserId } });
    if (!vipUser) throw new Error('VIP user not found');

    const code = `${vipUser.vipCode}_${Date.now().toString(36).toUpperCase()}`;

    await this.prisma.vipReferral.create({
      data: {
        vipUserId,
        code,
        status: VipCodeStatus.ACTIVE,
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
      },
    });

    return code;
  }

  async useCode(code: string, usedBy: bigint) {
    const referral = await this.prisma.vipReferral.findUnique({ where: { code } });

    if (!referral) return { success: false, error: 'Code not found' };
    if (referral.status !== VipCodeStatus.ACTIVE) return { success: false, error: 'Code not active' };
    if (referral.expiresAt && referral.expiresAt < new Date()) {
      await this.prisma.vipReferral.update({
        where: { id: referral.id },
        data: { status: VipCodeStatus.EXPIRED },
      });
      return { success: false, error: 'Code expired' };
    }

    await this.prisma.vipReferral.update({
      where: { id: referral.id },
      data: {
        status: VipCodeStatus.USED,
        usedBy,
        usedAt: new Date(),
      },
    });

    return { success: true, vipUserId: referral.vipUserId };
  }

  async getCodesByVipUser(vipUserId: number) {
    return this.prisma.vipReferral.findMany({
      where: { vipUserId },
      orderBy: { createdAt: 'desc' },
    });
  }
}
