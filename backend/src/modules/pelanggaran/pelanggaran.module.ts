import { Module } from '@nestjs/common';
import { PelanggaranService } from './pelanggaran.service';
import { PelanggaranController } from './pelanggaran.controller';
import { PrismaModule } from '../../common/prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [PelanggaranController],
  providers: [PelanggaranService],
  exports: [PelanggaranService],
})
export class PelanggaranModule {}
