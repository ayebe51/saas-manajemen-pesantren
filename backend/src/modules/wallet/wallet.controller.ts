import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { TenantId } from '../../common/decorators/tenant-id.decorator';
import { ApiKeyGuard } from '../../common/guards/api-key.guard';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { TenantGuard } from '../../common/guards/tenant.guard';
import {
  CreatePaymentDto,
  ManualResolveDepositDto,
  MootaWebhookDto,
  RequestDepositDto,
} from './dto/wallet.dto';
import { WalletService } from './wallet.service';

@ApiTags('Dompet Digital (Wallet)')
@Controller('api/v1/wallet')
export class WalletController {
  constructor(private readonly walletService: WalletService) {}

  @Get('santri/:santriId')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, TenantGuard, RolesGuard)
  @Roles('SUPERADMIN', 'TENANT_ADMIN', 'PENGURUS', 'WALI')
  @ApiOperation({ summary: 'Melihat saldo dan riwayat mutasi dompet santri' })
  async getWallet(@TenantId() tenantId: string, @Param('santriId') santriId: string) {
    return this.walletService.getWallet(tenantId, santriId);
  }

  @Post('deposit/request')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, TenantGuard, RolesGuard)
  @Roles('SUPERADMIN', 'TENANT_ADMIN', 'PENGURUS', 'WALI')
  @ApiOperation({ summary: 'Minta nomor tagihan Unik Top-Up (Ticket)' })
  async requestDeposit(@TenantId() tenantId: string, @Body() dto: RequestDepositDto) {
    return this.walletService.requestDeposit(tenantId, dto);
  }

  @Post('deposit/resolve')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, TenantGuard, RolesGuard)
  @Roles('SUPERADMIN', 'TENANT_ADMIN', 'PENGURUS')
  @ApiOperation({ summary: 'Kasir/Admin menyetujui mutasi top-up secara manual dari dasbor' })
  async manualResolveDeposit(
    @TenantId() tenantId: string,
    @CurrentUser('userId') userId: string,
    @Body() dto: ManualResolveDepositDto,
  ) {
    return this.walletService.manualResolveDeposit(tenantId, userId, dto);
  }

  @Post('pos/payment')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, TenantGuard, RolesGuard)
  @Roles('SUPERADMIN', 'TENANT_ADMIN', 'PENGURUS')
  @ApiOperation({ summary: 'Kasir asrama mencatat transaksi uang keluar / Jajan' })
  async makePayment(
    @TenantId() tenantId: string,
    @CurrentUser('userId') userId: string,
    @Body() dto: CreatePaymentDto,
  ) {
    return this.walletService.makePayment(tenantId, userId, dto);
  }

  @Post('webhook/moota/:tenantId')
  @UseGuards(ApiKeyGuard) // System-to-system API key auth
  @ApiOperation({
    summary: 'Endpoint rahasia menerima HTTP Push (Webhook) mutasi rekening Bank harian',
  })
  async handleMootaWebhook(
    @Param('tenantId') tenantId: string,
    @Body() payload: MootaWebhookDto[],
  ) {
    return this.walletService.handleMootaWebhook(tenantId, payload);
  }
}
