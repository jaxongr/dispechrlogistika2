import { Module } from '@nestjs/common';
import { VipUserService } from './vip-user.service.js';
import { VipReferralService } from './vip-referral.service.js';
import { VipQualificationService } from './vip-qualification.service.js';
import { ReferralService } from './referral.service.js';
import { WeeklyActivityService } from './weekly-activity.service.js';
import { ReferralController } from './referral.controller.js';

@Module({
  providers: [
    VipUserService,
    VipReferralService,
    VipQualificationService,
    ReferralService,
    WeeklyActivityService,
  ],
  controllers: [ReferralController],
  exports: [VipUserService, VipReferralService, ReferralService],
})
export class ReferralModule {}
