import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { TelegramBotService } from './telegram-bot.service.js';

export interface ChannelPost {
  senderName: string;
  phone: string;
  text: string;
  groupTitle?: string;
  fromRegion?: string;
  toRegion?: string;
}

@Injectable()
export class TelegramBotChannel {
  private readonly logger = new Logger(TelegramBotChannel.name);
  private readonly targetGroupId: string;

  constructor(
    private readonly config: ConfigService,
    private readonly botService: TelegramBotService,
  ) {
    this.targetGroupId = this.config.get<string>('TARGET_GROUP_ID', '-1003131208840');
  }

  async postToChannel(post: ChannelPost) {
    const html = this.formatPost(post);

    try {
      await this.botService.sendMessage(this.targetGroupId, html);
      return true;
    } catch (err) {
      this.logger.error('Failed to post to channel', err);
      return false;
    }
  }

  private formatPost(post: ChannelPost): string {
    const lines: string[] = [];

    lines.push(`🚛 <b>Yuk tashish e'loni</b>`);
    lines.push('');

    if (post.fromRegion || post.toRegion) {
      lines.push(`📍 <b>${post.fromRegion || '—'} ➜ ${post.toRegion || '—'}</b>`);
      lines.push('');
    }

    lines.push(this.escapeHtml(post.text));
    lines.push('');

    if (post.phone) {
      lines.push(`📞 <b>${post.phone}</b>`);
    }

    if (post.senderName) {
      lines.push(`👤 ${this.escapeHtml(post.senderName)}`);
    }

    if (post.groupTitle) {
      lines.push(`📢 ${this.escapeHtml(post.groupTitle)}`);
    }

    return lines.join('\n');
  }

  private escapeHtml(text: string): string {
    return text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }
}
