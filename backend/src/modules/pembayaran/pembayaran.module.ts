import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PembayaranService } from './pembayaran.service';
import { PembayaranController } from './pembayaran.controller';
import { StripeService } from './stripe.service';
import { PrismaModule } from '../../common/prisma/prisma.module';

@Module({
  imports: [PrismaModule, ConfigModule],
  controllers: [PembayaranController],
  providers: [PembayaranService, StripeService],
  exports: [PembayaranService],
})
export class PembayaranModule {}
