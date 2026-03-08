import { Module } from '@nestjs/common';
import { WaliPortalController } from './wali-portal.controller';
import { WaliPortalService } from './wali-portal.service';

@Module({
  controllers: [WaliPortalController],
  providers: [WaliPortalService],
})
export class WaliPortalModule {}
