import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { IsDateString, IsEnum, IsNotEmpty, IsNumber, IsOptional, IsString } from 'class-validator';

export class CreateItemDto {
  @ApiProperty() @IsString() @IsNotEmpty() sku: string;
  @ApiProperty() @IsString() @IsNotEmpty() name: string;
  @ApiPropertyOptional() @IsString() @IsOptional() description?: string;
  @ApiProperty({ description: 'Kategori: SERAGAM, BUKU, ALAT_TULIS, MAKANAN' })
  @IsString()
  @IsNotEmpty()
  category: string;

  @ApiProperty() @IsNumber() @IsNotEmpty() price: number;
  @ApiPropertyOptional() @IsNumber() @IsOptional() costPrice?: number;

  @ApiPropertyOptional() @IsNumber() @IsOptional() stock?: number;
  @ApiPropertyOptional() @IsNumber() @IsOptional() minStock?: number;
}

export class UpdateItemDto extends PartialType(CreateItemDto) {}

export class CreateInventoryTransactionDto {
  @ApiProperty({ description: 'IN, OUT, ADJUSTMENT' }) @IsString() @IsNotEmpty() type: string;
  @ApiProperty() @IsNumber() @IsNotEmpty() quantity: number;
  @ApiPropertyOptional() @IsString() @IsOptional() reference?: string;
  @ApiPropertyOptional() @IsString() @IsOptional() notes?: string;
}

export class CreateSupplierDto {
  @ApiProperty() @IsString() @IsNotEmpty() name: string;
  @ApiPropertyOptional() @IsString() @IsOptional() contact?: string;
  @ApiPropertyOptional() @IsString() @IsOptional() address?: string;
  @ApiPropertyOptional() @IsString() @IsOptional() email?: string;
}

export class UpdateSupplierDto extends PartialType(CreateSupplierDto) {}

export class CreatePurchaseOrderDto {
  @ApiProperty() @IsString() @IsNotEmpty() supplierId: string;
  @ApiProperty() @IsString() @IsNotEmpty() poNumber: string;
  @ApiProperty() @IsNumber() @IsNotEmpty() totalCost: number;
  @ApiPropertyOptional() @IsString() @IsOptional() notes?: string;
}

export class UpdatePurchaseOrderDto extends PartialType(CreatePurchaseOrderDto) {
  @ApiPropertyOptional({ description: 'DRAFT, SENT, RECEIVED, PARTIAL, CANCELLED' })
  @IsString()
  @IsOptional()
  status?: string;
}
