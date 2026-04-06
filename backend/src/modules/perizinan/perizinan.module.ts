import { Module } from '@nestjs/common';
import { PerizinanService } from './perizinan.service';
import { PerizinanController } from './perizinan.controller';
import { PrismaModule } from '../../common/prisma/prisma.module';
import { AuditLogModule } from '../audit-log/audit-log.module';

@Module({
  imports: [PrismaModule, AuditLogModule],
  controllers: [PerizinanController],
  providers: [PerizinanService],
  exports: [PerizinanService],
})
export class PerizinanModule {}
