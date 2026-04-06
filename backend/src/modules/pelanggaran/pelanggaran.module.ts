import { Module } from '@nestjs/common';
import { PelanggaranService } from './pelanggaran.service';
import { PelanggaranController } from './pelanggaran.controller';
import { PrismaModule } from '../../common/prisma/prisma.module';
import { WaEngineModule } from '../wa-engine/wa-engine.module';
import { AuditLogModule } from '../audit-log/audit-log.module';

@Module({
  imports: [PrismaModule, WaEngineModule, AuditLogModule],
  controllers: [PelanggaranController],
  providers: [PelanggaranService],
  exports: [PelanggaranService],
})
export class PelanggaranModule {}
