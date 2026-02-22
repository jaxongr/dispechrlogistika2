import { Module } from '@nestjs/common';
import { AutoBlockerService } from './auto-blocker.service.js';
import { BlockedUsersCleanupService } from './blocked-users-cleanup.service.js';
import { SmsNotificationService } from './sms-notification.service.js';

@Module({
  providers: [AutoBlockerService, BlockedUsersCleanupService, SmsNotificationService],
  exports: [AutoBlockerService, SmsNotificationService],
})
export class AutoBlockerModule {}
