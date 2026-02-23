import { Module } from '@nestjs/common';
import { KunjunganService } from './kunjungan.service';
import { KunjunganController } from './kunjungan.controller';
import { PrismaModule } from '../../common/prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [KunjunganController],
  providers: [KunjunganService],
  exports: [KunjunganService],
})
export class KunjunganModule {}
