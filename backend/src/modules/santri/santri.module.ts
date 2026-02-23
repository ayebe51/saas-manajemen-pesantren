import { Module } from '@nestjs/common';
import { SantriService } from './santri.service';
import { SantriController } from './santri.controller';
import { PrismaModule } from '../../common/prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [SantriController],
  providers: [SantriService],
  exports: [SantriService],
})
export class SantriModule {}
