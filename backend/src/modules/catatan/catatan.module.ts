import { Module } from '@nestjs/common';
import { CatatanService } from './catatan.service';
import { CatatanController } from './catatan.controller';
import { BukuPenghubungService } from './buku-penghubung.service';
import { BukuPenghubungController } from './buku-penghubung.controller';
import { PrismaModule } from '../../common/prisma/prisma.module';
import { AuditLogModule } from '../audit-log/audit-log.module';

@Module({
  imports: [PrismaModule, AuditLogModule],
  controllers: [CatatanController, BukuPenghubungController],
  providers: [CatatanService, BukuPenghubungService],
  exports: [CatatanService, BukuPenghubungService],
})
export class CatatanModule {}
