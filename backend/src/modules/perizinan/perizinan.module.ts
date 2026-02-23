import { Module } from '@nestjs/common';
import { PerizinanService } from './perizinan.service';
import { PerizinanController } from './perizinan.controller';
import { PrismaModule } from '../../common/prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [PerizinanController],
  providers: [PerizinanService],
  exports: [PerizinanService],
})
export class PerizinanModule {}
