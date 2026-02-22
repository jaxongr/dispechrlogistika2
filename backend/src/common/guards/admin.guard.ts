import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class AdminGuard implements CanActivate {
  private readonly adminIds: Set<string>;

  constructor(private readonly configService: ConfigService) {
    const ids = this.configService.get<string>('ADMIN_IDS', '');
    this.adminIds = new Set(ids.split(',').map((id) => id.trim()).filter(Boolean));
  }

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user?.telegramId) return false;

    return this.adminIds.has(String(user.telegramId));
  }
}
