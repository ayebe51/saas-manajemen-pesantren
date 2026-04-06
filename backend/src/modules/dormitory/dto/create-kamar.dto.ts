import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsInt, IsNotEmpty, IsOptional, IsString, Min } from 'class-validator';

export enum KamarStatus {
  TERSEDIA = 'TERSEDIA',
  PENUH = 'PENUH',
  MAINTENANCE = 'MAINTENANCE',
}

export class CreateKamarDto {
  @ApiProperty({ description: 'ID asrama tempat kamar berada' })
  @IsString()
  @IsNotEmpty()
  asramaId: string;

  @ApiProperty({ description: 'Nama/nomor kamar' })
  @IsString()
  @IsNotEmpty()
  nama: string;

  @ApiProperty({ description: 'Kapasitas maksimal penghuni' })
  @IsInt()
  @Min(1)
  kapasitas: number;

  @ApiPropertyOptional({ description: 'Lantai kamar berada' })
  @IsInt()
  @IsOptional()
  lantai?: number;

  @ApiPropertyOptional({ enum: KamarStatus, default: KamarStatus.TERSEDIA })
  @IsEnum(KamarStatus)
  @IsOptional()
  status?: KamarStatus;
}
