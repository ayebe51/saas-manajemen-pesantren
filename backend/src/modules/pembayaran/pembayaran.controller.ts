import { Controller, Get, Post, Body, Param, Query, UseGuards, UseInterceptors, Req, BadRequestException, RawBodyRequest } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { Request } from 'express';
import { PembayaranService } from './pembayaran.service';
import { GenerateInvoiceDto, CreatePaymentIntentDto } from './dto/pembayaran.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { TenantId } from '../../common/decorators/tenant-id.decorator';
import { Public } from '../../common/decorators/public.decorator';
import { AuditLogInterceptor } from '../../common/interceptors/audit-log.interceptor';
import { StripeService } from './stripe.service';

@ApiTags('Pembayaran (Billing)')
@Controller('payments')
export class PembayaranController {
  constructor(
    private readonly pembayaranService: PembayaranService,
    private readonly stripeService: StripeService,
  ) {}

  // --- INVOICES ---

  @Get('invoices')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Get invoices' })
  @ApiQuery({ name: 'santriId', required: false })
  @ApiQuery({ name: 'status', required: false, enum: ['UNPAID', 'PARTIAL', 'PAID', 'CANCELLED'] })
  findAllInvoices(
    @TenantId() tenantId: string,
    @Query('santriId') santriId?: string,
    @Query('status') status?: string,
  ) {
    return this.pembayaranService.findAllInvoices(tenantId, { santriId, status });
  }

  @Post('invoices')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('SUPERADMIN', 'TENANT_ADMIN', 'PENGURUS')
  @UseInterceptors(AuditLogInterceptor)
  @ApiOperation({ summary: 'Generate a new invoice manually' })
  generateInvoice(
    @Body() dto: GenerateInvoiceDto,
    @TenantId() tenantId: string,
  ) {
    return this.pembayaranService.generateInvoice(tenantId, dto);
  }


  // --- PAYMENTS ---

  @Post('create-intent')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Create Stripe Payment Intent for an invoice' })
  createPaymentIntent(
    @Body() dto: CreatePaymentIntentDto,
    @TenantId() tenantId: string,
  ) {
    return this.pembayaranService.createPaymentIntent(tenantId, dto);
  }

  @Post('webhook/stripe')
  @Public()
  @ApiOperation({ summary: 'Stripe webhook endpoint for payment confirmation' })
  async handleStripeWebhook(@Req() request: RawBodyRequest<Request>) {
    const signature = request.headers['stripe-signature'];
    
    if (!signature && process.env.NODE_ENV === 'production') {
      throw new BadRequestException('Missing stripe-signature header');
    }

    let event;
    try {
      // In NestJS, you need to configure express to expose the raw body for Stripe webhooks
      // but for simplicity in this boiler plate, we'll assume it's handled or use the parsed body format
      // as our mock StripeService can handle it.
      event = this.stripeService.constructEvent(
        request.rawBody || JSON.stringify(request.body), 
        signature as string
      );
    } catch (err) {
      throw new BadRequestException(`Webhook Error: ${err.message}`);
    }

    if (event.type === 'payment_intent.succeeded') {
      const paymentIntent = event.data.object as any;
      await this.pembayaranService.handleSuccessfulPayment(
        paymentIntent.id,
        paymentIntent.metadata.invoiceId,
        paymentIntent.amount,
        paymentIntent.metadata.tenantId
      );
    }

    return { received: true };
  }
}
