import { IsString, IsNotEmpty, IsNumber, IsOptional, IsPositive } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class TopUpDto {
  @ApiProperty({ description: 'ID santri yang akan di-top-up' })
  @IsString()
  @IsNotEmpty()
  santriId: string;

  @ApiProperty({ description: 'Jumlah top-up (IDR)', example: 100000 })
  @IsNumber()
  @IsPositive()
  @Type(() => Number)
  jumlah: number;

  @ApiPropertyOptional({ description: 'Keterangan top-up' })
  @IsOptional()
  @IsString()
  keterangan?: string;

  @ApiPropertyOptional({ description: 'Metode top-up', example: 'TRANSFER' })
  @IsOptional()
  @IsString()
  metode?: string;
}
