import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { PrismaModule } from '../common/prisma/prisma.module';
import { ScheduledTasksService } from './scheduled.service';
import { LicenseModule } from '../modules/license/license.module';

@Module({
  imports: [PrismaModule, ScheduleModule.forRoot(), LicenseModule],
  providers: [ScheduledTasksService],
})
export class JobsModule {}
