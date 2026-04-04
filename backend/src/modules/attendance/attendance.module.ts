import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AttendanceController } from './attendance.controller';
import { AttendanceService } from './attendance.service';
import { PresensiController } from './presensi.controller';
import { PresensiService } from './presensi.service';
import { QrTokenService } from './qr-token.service';
import { GpsValidatorService } from './gps-validator.service';
import { PrismaModule } from '../../common/prisma/prisma.module';
import { AuditLogModule } from '../audit-log/audit-log.module';

@Module({
  imports: [PrismaModule, AuditLogModule, ConfigModule],
  controllers: [AttendanceController, PresensiController],
  providers: [
    AttendanceService,
    PresensiService,
    QrTokenService,
    GpsValidatorService,
  ],
  exports: [PresensiService, QrTokenService, GpsValidatorService],
})
export class AttendanceModule {}
