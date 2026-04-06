import { Module } from '@nestjs/common';
import { DormitoryService } from './dormitory.service';
import { DormitoryController } from './dormitory.controller';
import { AsramaService } from './asrama.service';
import { AsramaController } from './asrama.controller';
import { PrismaModule } from '../../common/prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [DormitoryController, AsramaController],
  providers: [DormitoryService, AsramaService],
  exports: [DormitoryService, AsramaService],
})
export class DormitoryModule {}
