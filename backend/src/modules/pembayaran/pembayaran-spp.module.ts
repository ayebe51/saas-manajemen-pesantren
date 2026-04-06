import { Module } from '@nestjs/common';
import { PrismaModule } from '../../common/prisma/prisma.module';
import { AuditLogModule } from '../audit-log/audit-log.module';
import { InvoiceService } from './invoice.service';
import { WalletSppService } from './wallet-spp.service';
import { PembayaranSppController } from './pembayaran-spp.controller';

/**
 * PembayaranSppModule — modul SPP, invoice, dan wallet top-up.
 * Requirements: 11.x, 12.x
 */
@Module({
  imports: [PrismaModule, AuditLogModule],
  controllers: [PembayaranSppController],
  providers: [InvoiceService, WalletSppService],
  exports: [InvoiceService, WalletSppService],
})
export class PembayaranSppModule {}
