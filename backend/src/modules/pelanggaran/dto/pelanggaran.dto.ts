import { IsString, IsOptional, IsInt, IsEnum, IsUUID, Min, Max } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export enum TingkatKeparahanDto {
  RINGAN = 'RINGAN',
  SEDANG = 'SEDANG',
  BERAT = 'BERAT',
}

export class CreatePelanggaranDto {
  @ApiProperty()
  @IsUUID()
  santriId: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  kategoriId?: string;

  @ApiProperty({ enum: TingkatKeparahanDto })
  @IsEnum(TingkatKeparahanDto)
  tingkatKeparahan: TingkatKeparahanDto;

  @ApiProperty({ description: 'Poin pelanggaran (0-100)', minimum: 0, maximum: 100 })
  @IsInt()
  @Min(0)
  @Max(100)
  poin: number;

  @ApiProperty()
  @IsString()
  category: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  keterangan?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;
}

export class CreateRewardPoinDto {
  @ApiProperty()
  @IsUUID()
  santriId: string;

  @ApiProperty({ description: 'Poin reward (1-100)', minimum: 1, maximum: 100 })
  @IsInt()
  @Min(1)
  @Max(100)
  poin: number;

  @ApiProperty()
  @IsString()
  keterangan: string;
}

export class CreateKategoriPelanggaranDto {
  @ApiProperty()
  @IsString()
  nama: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  deskripsi?: string;

  @ApiProperty({ enum: TingkatKeparahanDto })
  @IsEnum(TingkatKeparahanDto)
  tingkatKeparahan: TingkatKeparahanDto;

  @ApiPropertyOptional({ default: 0 })
  @IsOptional()
  @IsInt()
  @Min(0)
  poinDefault?: number;
}

export class CreatePembinaanDto {
  @ApiProperty()
  @IsUUID()
  santriId: string;

  @ApiProperty()
  @IsString()
  plan: string;

  @ApiProperty()
  @IsString()
  targetDate: string;

  @ApiProperty()
  @IsString()
  assignedTo: string;
}

export class QueryPelanggaranDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  santriId?: string;

  @ApiPropertyOptional({ enum: TingkatKeparahanDto })
  @IsOptional()
  @IsEnum(TingkatKeparahanDto)
  tingkatKeparahan?: TingkatKeparahanDto;
}
