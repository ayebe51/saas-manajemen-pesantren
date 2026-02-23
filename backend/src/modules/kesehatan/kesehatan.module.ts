import { Module } from '@nestjs/common';
import { KesehatanService } from './kesehatan.service';
import { KesehatanController } from './kesehatan.controller';
import { PrismaModule } from '../../common/prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [KesehatanController],
  providers: [KesehatanService],
  exports: [KesehatanService],
})
export class KesehatanModule {}
