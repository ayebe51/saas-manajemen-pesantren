import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import {
  CreateInventoryTransactionDto,
  CreateItemDto,
  CreatePurchaseOrderDto,
  CreateSupplierDto,
  UpdateItemDto,
  UpdatePurchaseOrderDto,
  UpdateSupplierDto,
} from './dto/inventory.dto';

@Injectable()
export class InventoryService {
  constructor(private readonly prisma: PrismaService) {}

  // --- Item Management ---
  async createItem(tenantId: string, createItemDto: CreateItemDto) {
    return this.prisma.item.create({
      data: { ...createItemDto, tenantId },
    });
  }

  async findAllItems(tenantId: string, category?: string) {
    const where: any = { tenantId };
    if (category) where.category = category;

    return this.prisma.item.findMany({ where });
  }

  async findOneItem(tenantId: string, id: string) {
    const item = await this.prisma.item.findFirst({
      where: { id, tenantId },
      include: { transactions: { orderBy: { date: 'desc' }, take: 10 } },
    });
    if (!item) throw new NotFoundException('Item not found');
    return item;
  }

  async updateItem(tenantId: string, id: string, updateItemDto: UpdateItemDto) {
    await this.findOneItem(tenantId, id);
    return this.prisma.item.update({ where: { id }, data: updateItemDto });
  }

  // --- Inventory Transaction (Stock Opname/Mutasi) ---
  async createTransaction(
    tenantId: string,
    itemId: string,
    dto: CreateInventoryTransactionDto,
    userId: string,
  ) {
    const item = await this.findOneItem(tenantId, itemId);

    return this.prisma.$transaction(async (prisma) => {
      // 1. Create transaction log
      const transaction = await prisma.inventoryTransaction.create({
        data: {
          ...dto,
          tenantId,
          itemId,
          handledBy: userId,
        },
      });

      // 2. Adjust Stock
      let newStock = item.stock;
      if (dto.type === 'IN') newStock += dto.quantity;
      if (dto.type === 'OUT') newStock -= dto.quantity;
      if (dto.type === 'ADJUSTMENT') newStock = dto.quantity; // Set to exact amount

      await prisma.item.update({
        where: { id: itemId },
        data: { stock: newStock },
      });

      return transaction;
    });
  }

  // --- Supplier & PO (Kulakan Barang) ---
  async createSupplier(tenantId: string, dto: CreateSupplierDto) {
    return this.prisma.supplier.create({ data: { ...dto, tenantId } });
  }

  async findAllSuppliers(tenantId: string) {
    return this.prisma.supplier.findMany({ where: { tenantId } });
  }

  async createPurchaseOrder(tenantId: string, dto: CreatePurchaseOrderDto) {
    return this.prisma.purchaseOrder.create({ data: { ...dto, tenantId } });
  }

  async updatePurchaseOrder(tenantId: string, id: string, dto: UpdatePurchaseOrderDto) {
    const po = await this.prisma.purchaseOrder.findFirst({ where: { id, tenantId } });
    if (!po) throw new NotFoundException('PO not found');

    return this.prisma.purchaseOrder.update({ where: { id }, data: dto });
  }
}
