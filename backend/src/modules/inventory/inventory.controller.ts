import { Controller, Get, Post, Body, Param, Put, UseGuards, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { InventoryService } from './inventory.service';
import {
  CreateInventoryTransactionDto,
  CreateItemDto,
  CreatePurchaseOrderDto,
  CreateSupplierDto,
  UpdateItemDto,
  UpdatePurchaseOrderDto,
} from './dto/inventory.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { TenantGuard } from '../../common/guards/tenant.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { TenantId } from '../../common/decorators/tenant-id.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@ApiTags('Inventory & Koperasi')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, TenantGuard, RolesGuard)
@Controller('api/v1/inventory')
export class InventoryController {
  constructor(private readonly inventoryService: InventoryService) {}

  // --- Items ---
  @Post('items')
  @Roles('SUPERADMIN', 'TENANT_ADMIN', 'PENGURUS')
  @ApiOperation({ summary: 'Menambah barang baru ke katalog Koperasi/Gudang' })
  createItem(@TenantId() tenantId: string, @Body() createItemDto: CreateItemDto) {
    return this.inventoryService.createItem(tenantId, createItemDto);
  }

  @Get('items')
  @Roles('SUPERADMIN', 'TENANT_ADMIN', 'PENGURUS', 'GURU', 'MUSYRIF')
  @ApiOperation({ summary: 'Melihat histori stok seluruh barang' })
  @ApiQuery({
    name: 'category',
    required: false,
    description: 'Filter by category (SERAGAM, BUKU, MAKANAN)',
  })
  findAllItems(@TenantId() tenantId: string, @Query('category') category?: string) {
    return this.inventoryService.findAllItems(tenantId, category);
  }

  @Get('items/:id')
  @Roles('SUPERADMIN', 'TENANT_ADMIN', 'PENGURUS', 'GURU', 'MUSYRIF')
  @ApiOperation({ summary: 'Melihat detail spesifik dan riwayat masuk/keluar suatu barang' })
  findOneItem(@TenantId() tenantId: string, @Param('id') id: string) {
    return this.inventoryService.findOneItem(tenantId, id);
  }

  @Put('items/:id')
  @Roles('SUPERADMIN', 'TENANT_ADMIN', 'PENGURUS')
  @ApiOperation({ summary: 'Mengubah nama, gambar, sku, atau kategori barang eksisting' })
  updateItem(
    @TenantId() tenantId: string,
    @Param('id') id: string,
    @Body() updateItemDto: UpdateItemDto,
  ) {
    return this.inventoryService.updateItem(tenantId, id, updateItemDto);
  }

  // --- Transactions ---
  @Post('items/:id/transactions')
  @Roles('SUPERADMIN', 'TENANT_ADMIN', 'PENGURUS')
  @ApiOperation({ summary: 'Melakukan mutasi stok barang (Masuk/Keluar/Penyesuaian)' })
  createTransaction(
    @TenantId() tenantId: string,
    @Param('id') itemId: string,
    @Body() dto: CreateInventoryTransactionDto,
    @CurrentUser() user: any,
  ) {
    return this.inventoryService.createTransaction(tenantId, itemId, dto, user.userId);
  }

  // --- Suppliers ---
  @Post('suppliers')
  @Roles('SUPERADMIN', 'TENANT_ADMIN', 'PENGURUS')
  @ApiOperation({ summary: 'Mendaftarkan suplier/pemasok barang asrama' })
  createSupplier(@TenantId() tenantId: string, @Body() dto: CreateSupplierDto) {
    return this.inventoryService.createSupplier(tenantId, dto);
  }

  @Get('suppliers')
  @Roles('SUPERADMIN', 'TENANT_ADMIN', 'PENGURUS')
  @ApiOperation({ summary: 'Data List partner pemasok' })
  findAllSuppliers(@TenantId() tenantId: string) {
    return this.inventoryService.findAllSuppliers(tenantId);
  }

  // --- Purchase Orders ---
  @Post('purchase-orders')
  @Roles('SUPERADMIN', 'TENANT_ADMIN', 'PENGURUS')
  @ApiOperation({ summary: 'Membuka dokumen Purchase Order (Kulakan) ke Supplier' })
  createPurchaseOrder(@TenantId() tenantId: string, @Body() dto: CreatePurchaseOrderDto) {
    return this.inventoryService.createPurchaseOrder(tenantId, dto);
  }

  @Put('purchase-orders/:id')
  @Roles('SUPERADMIN', 'TENANT_ADMIN', 'PENGURUS')
  @ApiOperation({ summary: 'Mengubah status kirim/bayar dokumen PO Koperasi' })
  updatePurchaseOrder(
    @TenantId() tenantId: string,
    @Param('id') id: string,
    @Body() dto: UpdatePurchaseOrderDto,
  ) {
    return this.inventoryService.updatePurchaseOrder(tenantId, id, dto);
  }
}
