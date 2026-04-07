import { Module } from '@nestjs/common';
import { EidService } from './eid.service';
import { EidController } from './eid.controller';
import { EidVerifyController } from './eid-verify.controller';
import { PrismaModule } from '../../common/prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [EidController, EidVerifyController],
  providers: [EidService],
  exports: [EidService],
})
export class EidModule {}
