import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { PrismaModule } from '../common/prisma/prisma.module';
import { ScheduledTasksService } from './scheduled.service';
import { LicenseModule } from '../modules/license/license.module';
import { PembayaranSppModule } from '../modules/pembayaran/pembayaran-spp.module';
import { PerizinanModule } from '../modules/perizinan/perizinan.module';

@Module({
  imports: [PrismaModule, ScheduleModule.forRoot(), LicenseModule, PembayaranSppModule, PerizinanModule],
  providers: [ScheduledTasksService],
})
export class JobsModule {}
