import {
  IsString,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsDateString,
  IsPositive,
  IsEnum,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export enum InvoiceTipe {
  SPP = 'SPP',
  DAFTAR_ULANG = 'DAFTAR_ULANG',
  LAINNYA = 'LAINNYA',
}

export class CreateInvoiceDto {
  @ApiProperty({ description: 'ID santri' })
  @IsString()
  @IsNotEmpty()
  santriId: string;

  @ApiPropertyOptional({ enum: InvoiceTipe, default: InvoiceTipe.SPP })
  @IsOptional()
  @IsEnum(InvoiceTipe)
  tipe?: InvoiceTipe;

  @ApiProperty({ description: 'Jumlah tagihan (IDR)', example: 500000 })
  @IsNumber()
  @IsPositive()
  @Type(() => Number)
  jumlah: number;

  @ApiProperty({ description: 'Tanggal jatuh tempo', example: '2024-01-31' })
  @IsDateString()
  @IsNotEmpty()
  dueDate: string;

  @ApiPropertyOptional({ description: 'Keterangan tambahan' })
  @IsOptional()
  @IsString()
  keterangan?: string;
}
