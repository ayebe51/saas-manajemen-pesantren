import { Module } from '@nestjs/common';
import { PrismaModule } from '../../common/prisma/prisma.module';
import { AuditLogModule } from '../audit-log/audit-log.module';
import { AuthModule } from '../auth/auth.module';
import { EmployeeController } from './employee.controller';
import { EmployeeService } from './employee.service';
import { KepegawaianController } from './kepegawaian.controller';
import { KepegawaianService } from './kepegawaian.service';

@Module({
  imports: [PrismaModule, AuditLogModule, AuthModule],
  controllers: [EmployeeController, KepegawaianController],
  providers: [EmployeeService, KepegawaianService],
  exports: [KepegawaianService],
})
export class EmployeeModule {}
