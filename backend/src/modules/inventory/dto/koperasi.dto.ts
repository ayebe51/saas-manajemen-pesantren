import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';

// ─── Item DTOs ────────────────────────────────────────────────────────────────

export class CreateKoperasiItemDto {
  @ApiProperty({ description: 'Nama item koperasi' })
  @IsString()
  @IsNotEmpty()
  nama: string;

  @ApiProperty({ description: 'Harga satuan item (Decimal)' })
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  harga: number;

  @ApiPropertyOptional({ description: 'Stok awal', default: 0 })
  @IsInt()
  @Min(0)
  @IsOptional()
  @Type(() => Number)
  stok?: number;

  @ApiPropertyOptional({ description: 'Kategori item (opsional)' })
  @IsString()
  @IsOptional()
  kategori?: string;
}

export class UpdateKoperasiItemDto {
  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  nama?: string;

  @ApiPropertyOptional()
  @IsNumber()
  @Min(0)
  @IsOptional()
  @Type(() => Number)
  harga?: number;

  @ApiPropertyOptional()
  @IsInt()
  @Min(0)
  @IsOptional()
  @Type(() => Number)
  stok?: number;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  kategori?: string;

  @ApiPropertyOptional()
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}

// ─── Purchase DTO ─────────────────────────────────────────────────────────────

export class PurchaseKoperasiDto {
  @ApiProperty({ description: 'UUID santri yang melakukan pembelian' })
  @IsUUID()
  @IsNotEmpty()
  santriId: string;

  @ApiProperty({ description: 'UUID item yang dibeli' })
  @IsUUID()
  @IsNotEmpty()
  itemId: string;

  @ApiProperty({ description: 'Jumlah item yang dibeli', minimum: 1 })
  @IsInt()
  @Min(1)
  @Type(() => Number)
  jumlah: number;
}
