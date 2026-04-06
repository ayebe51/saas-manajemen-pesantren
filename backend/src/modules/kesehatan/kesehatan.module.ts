import { Module } from '@nestjs/common';
import { KesehatanService } from './kesehatan.service';
import { KesehatanController } from './kesehatan.controller';
import { PrismaModule } from '../../common/prisma/prisma.module';
import { WaEngineModule } from '../wa-engine/wa-engine.module';

@Module({
  imports: [PrismaModule, WaEngineModule],
  controllers: [KesehatanController],
  providers: [KesehatanService],
  exports: [KesehatanService],
})
export class KesehatanModule {}
