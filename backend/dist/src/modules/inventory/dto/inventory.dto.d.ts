export declare class CreateItemDto {
    sku: string;
    name: string;
    description?: string;
    category: string;
    price: number;
    costPrice?: number;
    stock?: number;
    minStock?: number;
}
declare const UpdateItemDto_base: import("@nestjs/common").Type<Partial<CreateItemDto>>;
export declare class UpdateItemDto extends UpdateItemDto_base {
}
export declare class CreateInventoryTransactionDto {
    type: string;
    quantity: number;
    reference?: string;
    notes?: string;
}
export declare class CreateSupplierDto {
    name: string;
    contact?: string;
    address?: string;
    email?: string;
}
declare const UpdateSupplierDto_base: import("@nestjs/common").Type<Partial<CreateSupplierDto>>;
export declare class UpdateSupplierDto extends UpdateSupplierDto_base {
}
export declare class CreatePurchaseOrderDto {
    supplierId: string;
    poNumber: string;
    totalCost: number;
    notes?: string;
}
declare const UpdatePurchaseOrderDto_base: import("@nestjs/common").Type<Partial<CreatePurchaseOrderDto>>;
export declare class UpdatePurchaseOrderDto extends UpdatePurchaseOrderDto_base {
    status?: string;
}
export {};
