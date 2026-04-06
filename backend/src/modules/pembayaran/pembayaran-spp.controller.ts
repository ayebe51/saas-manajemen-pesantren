import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  UseGuards,
  Headers,
  Req,
  ParseUUIDPipe,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiQuery,
  ApiHeader,
  ApiParam,
} from '@nestjs/swagger';
import { Request } from 'express';
import { InvoiceService } from './invoice.service';
import { WalletSppService } from './wallet-spp.service';
import { WaQueueService } from '../wa-engine/wa-queue.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { TenantId } from '../../common/decorators/tenant-id.decorator';
import { CreateInvoiceDto } from './dto/create-invoice.dto';
import { ConfirmPaymentDto } from './dto/confirm-payment.dto';
import { TopUpDto } from './dto/topup.dto';
import { PrismaService } from '../../common/prisma/prisma.service';

/**
 * PembayaranController — endpoint SPP, invoice, top-up, dan wallet.
 * Requirements: 11.5, 12.3
 */
@ApiTags('Pembayaran SPP & Wallet')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('pembayaran')
export class PembayaranSppController {
  constructor(
    private readonly invoiceService: InvoiceService,
    private readonly walletService: WalletSppService,
    private readonly waQueue: WaQueueService,
    private readonly prisma: PrismaService,
  ) {}

  // ─── INVOICE ENDPOINTS ────────────────────────────────────────────────────

  /**
   * POST /pembayaran/invoices — Buat invoice SPP baru
   * Requirements: 11.1
   */
  @Post('invoices')
  @UseGuards(RolesGuard)
  @Roles('SUPERADMIN', 'TENANT_ADMIN', 'PENGURUS', 'Petugas_Keuangan')
  @ApiOperation({ summary: 'Buat invoice SPP baru dengan nomor unik' })
  async createInvoice(
    @Body() dto: CreateInvoiceDto,
    @TenantId() tenantId: string,
    @CurrentUser('userId') userId: string,
  ) {
    return this.invoiceService.createInvoice(tenantId, dto, userId);
  }

  /**
   * GET /pembayaran/invoices — Daftar invoice
   * Requirements: 11.8
   */
  @Get('invoices')
  @ApiOperation({ summary: 'Daftar invoice dengan filter' })
  @ApiQuery({ name: 'santriId', required: false })
  @ApiQuery({ name: 'status', required: false, enum: ['PENDING', 'PAID', 'EXPIRED', 'CANCELLED', 'REFUNDED'] })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  async findAllInvoices(
    @TenantId() tenantId: string,
    @Query('santriId') santriId?: string,
    @Query('status') status?: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.invoiceService.findAll(tenantId, { santriId, status, page, limit });
  }

  /**
   * POST /pembayaran/invoices/:id/confirm — Konfirmasi pembayaran
   * Menggunakan SELECT FOR UPDATE + X-Idempotency-Key untuk mencegah race condition
   * Requirements: 11.3, 11.4, 11.5
   */
  @Post('invoices/:id/confirm')
  @UseGuards(RolesGuard)
  @Roles('SUPERADMIN', 'TENANT_ADMIN', 'PENGURUS', 'Petugas_Keuangan')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Konfirmasi pembayaran invoice (PENDING → PAID)' })
  @ApiParam({ name: 'id', description: 'Invoice ID' })
  @ApiHeader({ name: 'X-Idempotency-Key', required: false, description: 'Idempotency key untuk mencegah double-submit' })
  async confirmPayment(
    @Param('id') invoiceId: string,
    @Body() dto: ConfirmPaymentDto,
    @TenantId() tenantId: string,
    @CurrentUser('userId') userId: string,
    @Headers('x-idempotency-key') idempotencyKey?: string,
  ) {
    const invoice = await this.invoiceService.confirmPayment(
      tenantId,
      invoiceId,
      dto,
      userId,
      idempotencyKey,
    );

    // Kirim notifikasi WA setelah pembayaran berhasil — Requirement 11.5
    this.sendPaymentNotification(invoice).catch((err) => {
      // Fire-and-forget: kegagalan WA tidak menggagalkan response
    });

    return invoice;
  }

  // ─── WALLET / TOP-UP ENDPOINTS ────────────────────────────────────────────

  /**
   * POST /pembayaran/topup — Top-up saldo santri
   * Requirements: 12.1, 12.2, 12.3
   */
  @Post('topup')
  @UseGuards(RolesGuard)
  @Roles('SUPERADMIN', 'TENANT_ADMIN', 'PENGURUS', 'Petugas_Keuangan', 'WALI')
  @ApiOperation({ summary: 'Top-up saldo elektronik santri' })
  async topUp(
    @Body() dto: TopUpDto,
    @TenantId() tenantId: string,
    @CurrentUser('userId') userId: string,
  ) {
    const result = await this.walletService.topUp(tenantId, dto, userId);

    // Kirim notifikasi WA setelah top-up berhasil — Requirement 12.3
    this.sendTopUpNotification(tenantId, dto.santriId, result).catch(() => {});

    return result;
  }

  /**
   * GET /pembayaran/wallet/:santriId — Saldo dan riwayat transaksi
   * Requirements: 12.4
   */
  @Get('wallet/:santriId')
  @ApiOperation({ summary: 'Lihat saldo dan riwayat transaksi wallet santri' })
  @ApiParam({ name: 'santriId', description: 'Santri ID' })
  async getWallet(
    @Param('santriId') santriId: string,
    @TenantId() tenantId: string,
  ) {
    return this.walletService.getWalletBySantri(tenantId, santriId);
  }

  // ─── PRIVATE HELPERS ──────────────────────────────────────────────────────

  private async sendPaymentNotification(invoice: any) {
    if (!invoice?.santri?.walis?.length) return;

    const wali = invoice.santri.walis[0]?.wali;
    if (!wali?.noHp && !wali?.phone) return;

    const noHp = wali.noHp ?? wali.phone;

    this.waQueue.enqueue({
      tipeNotifikasi: 'pembayaran',
      noTujuan: noHp,
      templateKey: 'PEMBAYARAN_BERHASIL',
      payload: {
        nama_santri: invoice.santri.name ?? '',
        invoice_number: invoice.invoiceNumber ?? '',
        jumlah: String(invoice.jumlah ?? invoice.amountDue ?? 0),
        tanggal: new Date().toLocaleDateString('id-ID'),
      },
    });
  }

  private async sendTopUpNotification(tenantId: string, santriId: string, result: any) {
    const santri = await this.prisma.santri.findFirst({
      where: { id: santriId, tenantId },
      include: { walis: { include: { wali: true } } },
    });

    if (!santri?.walis?.length) return;

    const wali = santri.walis[0]?.wali;
    if (!wali?.noHp && !wali?.phone) return;

    const noHp = wali.noHp ?? wali.phone;

    this.waQueue.enqueue({
      tipeNotifikasi: 'topup',
      noTujuan: noHp,
      templateKey: 'TOPUP_BERHASIL',
      payload: {
        nama_santri: santri.name ?? '',
        jumlah: String(result.jumlah ?? 0),
        saldo_terkini: String(result.saldoSesudah ?? 0),
        tanggal: new Date().toLocaleDateString('id-ID'),
      },
    });
  }
}
