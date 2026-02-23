"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.InventoryService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../common/prisma/prisma.service");
let InventoryService = class InventoryService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async createItem(tenantId, createItemDto) {
        return this.prisma.item.create({
            data: { ...createItemDto, tenantId },
        });
    }
    async findAllItems(tenantId, category) {
        const where = { tenantId };
        if (category)
            where.category = category;
        return this.prisma.item.findMany({ where });
    }
    async findOneItem(tenantId, id) {
        const item = await this.prisma.item.findFirst({
            where: { id, tenantId },
            include: { transactions: { orderBy: { date: 'desc' }, take: 10 } },
        });
        if (!item)
            throw new common_1.NotFoundException('Item not found');
        return item;
    }
    async updateItem(tenantId, id, updateItemDto) {
        await this.findOneItem(tenantId, id);
        return this.prisma.item.update({ where: { id }, data: updateItemDto });
    }
    async createTransaction(tenantId, itemId, dto, userId) {
        const item = await this.findOneItem(tenantId, itemId);
        return this.prisma.$transaction(async (prisma) => {
            const transaction = await prisma.inventoryTransaction.create({
                data: {
                    ...dto,
                    tenantId,
                    itemId,
                    handledBy: userId,
                },
            });
            let newStock = item.stock;
            if (dto.type === 'IN')
                newStock += dto.quantity;
            if (dto.type === 'OUT')
                newStock -= dto.quantity;
            if (dto.type === 'ADJUSTMENT')
                newStock = dto.quantity;
            await prisma.item.update({
                where: { id: itemId },
                data: { stock: newStock },
            });
            return transaction;
        });
    }
    async createSupplier(tenantId, dto) {
        return this.prisma.supplier.create({ data: { ...dto, tenantId } });
    }
    async findAllSuppliers(tenantId) {
        return this.prisma.supplier.findMany({ where: { tenantId } });
    }
    async createPurchaseOrder(tenantId, dto) {
        return this.prisma.purchaseOrder.create({ data: { ...dto, tenantId } });
    }
    async updatePurchaseOrder(tenantId, id, dto) {
        const po = await this.prisma.purchaseOrder.findFirst({ where: { id, tenantId } });
        if (!po)
            throw new common_1.NotFoundException('PO not found');
        return this.prisma.purchaseOrder.update({ where: { id }, data: dto });
    }
};
exports.InventoryService = InventoryService;
exports.InventoryService = InventoryService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], InventoryService);
//# sourceMappingURL=inventory.service.js.map