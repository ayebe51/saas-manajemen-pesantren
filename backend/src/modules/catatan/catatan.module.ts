import { Module } from '@nestjs/common';
import { CatatanService } from './catatan.service';
import { CatatanController } from './catatan.controller';
import { PrismaModule } from '../../common/prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [CatatanController],
  providers: [CatatanService],
  exports: [CatatanService],
})
export class CatatanModule {}
