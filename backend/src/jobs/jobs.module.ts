import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { PrismaModule } from '../common/prisma/prisma.module';
import { ScheduledTasksService } from './scheduled.service';

@Module({
  imports: [PrismaModule, ScheduleModule.forRoot()],
  providers: [ScheduledTasksService],
})
export class JobsModule {}
