import {
  Controller,
  Post,
  Body,
  UseGuards,
  Req,
  HttpCode,
  HttpStatus,
  Logger,
  Get,
} from '@nestjs/common';
import { PaymentService } from './payment.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiBody } from '@nestjs/swagger';
import { TenantId } from '../../common/decorators/tenant.decorator';

@ApiTags('Payments (Midtrans)')
@Controller('api/v1/payments')
export class PaymentController {
  private readonly logger = new Logger(PaymentController.name);

  constructor(private readonly paymentService: PaymentService) {}

  @Post('topup/request')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('SUPERADMIN', 'TENANT_ADMIN', 'WALI_SANTRI')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Minta Tiket Pembayaran Midtrans Snap (Top Up Dompet)' })
  @ApiBody({ schema: { example: { santriId: 'uuid', amount: 50000 } } })
  async requestTopUp(
    @TenantId() tenantId: string,
    @Body('santriId') santriId: string,
    @Body('amount') amount: number,
  ) {
    return this.paymentService.createTopUpTransaction(tenantId, santriId, amount);
  }

  // Endpoint Publik HANYA untuk ditangkap oleh Server Webhook Midtrans. Dilarang pasang JwtAuthGuard!
  @Post('midtrans/webhook')
  @HttpCode(HttpStatus.OK) // Webhook API midtrans expecting 200 OK fast
  @ApiOperation({ summary: 'Webhook Listener Pembayaran Midtrans (Otomatis Panggil by System)' })
  async midtransWebhookNotification(@Body() notificationBody: any) {
    this.logger.debug(`Midtrans Knocking on Webhook door...`);
    return this.paymentService.handleMidtransWebhook(notificationBody);
  }
}
