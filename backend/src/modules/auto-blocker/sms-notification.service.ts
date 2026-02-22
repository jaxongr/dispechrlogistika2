import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class SmsNotificationService {
  private readonly logger = new Logger(SmsNotificationService.name);
  private readonly token: string;
  private readonly device: string;

  constructor(private readonly config: ConfigService) {
    this.token = this.config.get<string>('SEMYSMS_TOKEN', '');
    this.device = this.config.get<string>('SEMYSMS_DEVICE', '');
  }

  async sendBlockNotification(phone: string, reason: string): Promise<boolean> {
    if (!this.token || !this.device) {
      this.logger.warn('SemySMS not configured, skipping SMS notification');
      return false;
    }

    try {
      const message =
        `Dispatchr: Sizning hisobingiz bloklandi.\n` +
        `Sabab: ${reason}\n` +
        `Murojaat: @dispatchr_admin`;

      const response = await fetch('https://semysms.net/api/3/sms.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          token: this.token,
          device: this.device,
          phone,
          msg: message,
        }),
      });

      if (response.ok) {
        this.logger.log(`SMS sent to ${phone}`);
        return true;
      }

      this.logger.error(`SMS failed for ${phone}: ${response.status}`);
      return false;
    } catch (err) {
      this.logger.error(`SMS error for ${phone}`, err);
      return false;
    }
  }
}
