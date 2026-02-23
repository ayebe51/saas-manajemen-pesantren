import { Module } from '@nestjs/common';
import { PpdbService } from './ppdb.service';
import { PpdbController } from './ppdb.controller';
import { PrismaModule } from '../../common/prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [PpdbController],
  providers: [PpdbService],
})
export class PpdbModule {}
