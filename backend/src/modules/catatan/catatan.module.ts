import { Module } from '@nestjs/common';
import { CatatanService } from './catatan.service';
import { CatatanController } from './catatan.controller';
import { BukuPenghubungService } from './buku-penghubung.service';
import { BukuPenghubungController } from './buku-penghubung.controller';
import { PrismaModule } from '../../common/prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [CatatanController, BukuPenghubungController],
  providers: [CatatanService, BukuPenghubungService],
  exports: [CatatanService, BukuPenghubungService],
})
export class CatatanModule {}
