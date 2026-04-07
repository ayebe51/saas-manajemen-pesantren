import { Module } from '@nestjs/common';
import { PpdbService } from './ppdb.service';
import { PpdbController } from './ppdb.controller';
import { PrismaModule } from '../../common/prisma/prisma.module';

/**
 * PpdbModule — modul Penerimaan Peserta Didik Baru.
 * WaQueueService tersedia secara global via WaEngineModule (@Global).
 * Requirements: 4.1 - 4.5
 */
@Module({
  imports: [PrismaModule],
  controllers: [PpdbController],
  providers: [PpdbService],
  exports: [PpdbService],
})
export class PpdbModule {}
