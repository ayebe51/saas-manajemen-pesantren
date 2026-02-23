import { PrismaService } from '../../common/prisma/prisma.service';
import { CreateInventoryTransactionDto, CreateItemDto, CreatePurchaseOrderDto, CreateSupplierDto, UpdateItemDto, UpdatePurchaseOrderDto } from './dto/inventory.dto';
export declare class InventoryService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    createItem(tenantId: string, createItemDto: CreateItemDto): Promise<{
        name: string;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        tenantId: string;
        description: string | null;
        category: string;
        sku: string;
        price: number;
        costPrice: number | null;
        stock: number;
        minStock: number;
    }>;
    findAllItems(tenantId: string, category?: string): Promise<{
        name: string;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        tenantId: string;
        description: string | null;
        category: string;
        sku: string;
        price: number;
        costPrice: number | null;
        stock: number;
        minStock: number;
    }[]>;
    findOneItem(tenantId: string, id: string): Promise<{
        transactions: {
            type: string;
            id: string;
            tenantId: string;
            date: Date;
            notes: string | null;
            reference: string | null;
            handledBy: string | null;
            quantity: number;
            itemId: string;
        }[];
    } & {
        name: string;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        tenantId: string;
        description: string | null;
        category: string;
        sku: string;
        price: number;
        costPrice: number | null;
        stock: number;
        minStock: number;
    }>;
    updateItem(tenantId: string, id: string, updateItemDto: UpdateItemDto): Promise<{
        name: string;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        tenantId: string;
        description: string | null;
        category: string;
        sku: string;
        price: number;
        costPrice: number | null;
        stock: number;
        minStock: number;
    }>;
    createTransaction(tenantId: string, itemId: string, dto: CreateInventoryTransactionDto, userId: string): Promise<{
        type: string;
        id: string;
        tenantId: string;
        date: Date;
        notes: string | null;
        reference: string | null;
        handledBy: string | null;
        quantity: number;
        itemId: string;
    }>;
    createSupplier(tenantId: string, dto: CreateSupplierDto): Promise<{
        name: string;
        id: string;
        address: string | null;
        createdAt: Date;
        email: string | null;
        tenantId: string;
        contact: string | null;
    }>;
    findAllSuppliers(tenantId: string): Promise<{
        name: string;
        id: string;
        address: string | null;
        createdAt: Date;
        email: string | null;
        tenantId: string;
        contact: string | null;
    }[]>;
    createPurchaseOrder(tenantId: string, dto: CreatePurchaseOrderDto): Promise<{
        id: string;
        status: string;
        createdAt: Date;
        updatedAt: Date;
        tenantId: string;
        notes: string | null;
        supplierId: string;
        poNumber: string;
        totalCost: number;
        orderDate: Date;
    }>;
    updatePurchaseOrder(tenantId: string, id: string, dto: UpdatePurchaseOrderDto): Promise<{
        id: string;
        status: string;
        createdAt: Date;
        updatedAt: Date;
        tenantId: string;
        notes: string | null;
        supplierId: string;
        poNumber: string;
        totalCost: number;
        orderDate: Date;
    }>;
}
