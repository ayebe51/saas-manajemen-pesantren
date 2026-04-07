import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { KoperasiService } from './koperasi.service';
import { CreateKoperasiItemDto, PurchaseKoperasiDto, UpdateKoperasiItemDto } from './dto/koperasi.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@ApiTags('Koperasi')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('api/v1/koperasi')
export class KoperasiController {
  constructor(private readonly koperasiService: KoperasiService) {}

  // ─── Items ──────────────────────────────────────────────────────────────────

  @Get('items')
  @Roles('SUPERADMIN', 'TENANT_ADMIN', 'PENGURUS', 'GURU', 'MUSYRIF', 'SANTRI', 'WALI')
  @ApiOperation({ summary: 'Daftar semua item koperasi yang aktif' })
  findAllItems() {
    return this.koperasiService.findAllItems();
  }

  @Post('items')
  @Roles('SUPERADMIN', 'TENANT_ADMIN', 'PENGURUS')
  @ApiOperation({ summary: 'Tambah item koperasi baru (Admin)' })
  createItem(@Body() dto: CreateKoperasiItemDto) {
    return this.koperasiService.createItem(dto);
  }

  @Put('items/:id')
  @Roles('SUPERADMIN', 'TENANT_ADMIN', 'PENGURUS')
  @ApiOperation({ summary: 'Update item koperasi (Admin)' })
  updateItem(@Param('id') id: string, @Body() dto: UpdateKoperasiItemDto) {
    return this.koperasiService.updateItem(id, dto);
  }

  @Delete('items/:id')
  @Roles('SUPERADMIN', 'TENANT_ADMIN', 'PENGURUS')
  @ApiOperation({ summary: 'Nonaktifkan item koperasi (Admin)' })
  deactivateItem(@Param('id') id: string) {
    return this.koperasiService.deactivateItem(id);
  }

  // ─── Purchase ───────────────────────────────────────────────────────────────

  @Post('purchase')
  @Roles('SUPERADMIN', 'TENANT_ADMIN', 'PENGURUS', 'SANTRI')
  @ApiOperation({ summary: 'Transaksi pembelian koperasi (debit wallet santri)' })
  purchase(@Body() dto: PurchaseKoperasiDto, @CurrentUser() user: any) {
    return this.koperasiService.purchase(
      dto.santriId,
      dto.itemId,
      dto.jumlah,
      user?.userId ?? user?.id,
    );
  }

  // ─── Transactions ───────────────────────────────────────────────────────────

  @Get('transactions')
  @Roles('SUPERADMIN', 'TENANT_ADMIN', 'PENGURUS', 'GURU', 'MUSYRIF')
  @ApiOperation({ summary: 'Daftar semua transaksi koperasi' })
  findAllTransactions() {
    return this.koperasiService.findAllTransactions();
  }

  @Get('transactions/santri/:santriId')
  @Roles('SUPERADMIN', 'TENANT_ADMIN', 'PENGURUS', 'GURU', 'MUSYRIF', 'SANTRI', 'WALI')
  @ApiOperation({ summary: 'Riwayat transaksi koperasi per santri' })
  findTransaksiBySantri(@Param('santriId') santriId: string) {
    return this.koperasiService.findTransaksiBySantri(santriId);
  }
}
