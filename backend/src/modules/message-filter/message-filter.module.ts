import { Module } from '@nestjs/common';
import { MessageFilterService } from './message-filter.service.js';
import { DispatcherDetectorService } from './dispatcher-detector.service.js';
import { PhoneExtractorService } from './phone-extractor.service.js';
import { ForeignPhoneService } from './foreign-phone.service.js';

@Module({
  providers: [
    MessageFilterService,
    DispatcherDetectorService,
    PhoneExtractorService,
    ForeignPhoneService,
  ],
  exports: [
    MessageFilterService,
    DispatcherDetectorService,
    PhoneExtractorService,
    ForeignPhoneService,
  ],
})
export class MessageFilterModule {}
