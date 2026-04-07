import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PembayaranService } from './pembayaran.service';
import { PembayaranController } from './pembayaran.controller';
import { StripeService } from './stripe.service';
import { PrismaModule } from '../../common/prisma/prisma.module';
import { AuditLogModule } from '../audit-log/audit-log.module';

@Module({
  imports: [PrismaModule, ConfigModule, AuditLogModule],
  controllers: [PembayaranController],
  providers: [PembayaranService, StripeService],
  exports: [PembayaranService],
})
export class PembayaranModule {}
