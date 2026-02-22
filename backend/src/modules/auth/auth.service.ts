import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../prisma/prisma.service.js';

export interface JwtPayload {
  sub: number;
  telegramId: string;
  isAdmin: boolean;
}

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
}

@Injectable()
export class AuthService {
  private readonly adminIds: Set<string>;

  constructor(
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
    private readonly prisma: PrismaService,
  ) {
    const ids = this.config.get<string>('ADMIN_IDS', '');
    this.adminIds = new Set(ids.split(',').map((id) => id.trim()).filter(Boolean));
  }

  isAdmin(telegramId: bigint | string): boolean {
    return this.adminIds.has(String(telegramId));
  }

  async generateTokens(userId: number, telegramId: bigint): Promise<TokenPair> {
    const payload: JwtPayload = {
      sub: userId,
      telegramId: String(telegramId),
      isAdmin: this.isAdmin(telegramId),
    };

    const [accessToken, refreshToken] = await Promise.all([
      this.jwt.signAsync(payload as any, {
        secret: this.config.get<string>('JWT_ACCESS_SECRET'),
        expiresIn: '15m' as any,
      }),
      this.jwt.signAsync(payload as any, {
        secret: this.config.get<string>('JWT_REFRESH_SECRET'),
        expiresIn: '7d' as any,
      }),
    ]);

    return { accessToken, refreshToken };
  }

  async refreshTokens(refreshToken: string): Promise<TokenPair> {
    try {
      const payload = await this.jwt.verifyAsync<JwtPayload>(refreshToken, {
        secret: this.config.get<string>('JWT_REFRESH_SECRET'),
      });

      const user = await this.prisma.botUser.findUnique({
        where: { id: payload.sub },
      });

      if (!user || user.isBlocked) {
        throw new UnauthorizedException('User not found or blocked');
      }

      return this.generateTokens(user.id, user.telegramId);
    } catch {
      throw new UnauthorizedException('Invalid refresh token');
    }
  }

  async validateUser(payload: JwtPayload) {
    const user = await this.prisma.botUser.findUnique({
      where: { id: payload.sub },
    });

    if (!user || user.isBlocked) {
      throw new UnauthorizedException();
    }

    return {
      id: user.id,
      telegramId: user.telegramId,
      isAdmin: this.isAdmin(user.telegramId),
    };
  }
}
