import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  IsDateString,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
} from 'class-validator';

export enum TahfidzType {
  ZIYADAH = 'ZIYADAH',
  MUROJAAH = 'MUROJAAH',
  SABAQ = 'SABAQ',
}

export class CreateTahfidzDto {
  @ApiProperty()
  @IsUUID()
  @IsNotEmpty()
  santriId: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  surah: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  ayat?: string;

  @ApiProperty({ enum: TahfidzType })
  @IsEnum(TahfidzType)
  @IsNotEmpty()
  type: TahfidzType;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  grade?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  notes?: string;

  @ApiPropertyOptional()
  @IsDateString()
  @IsOptional()
  date?: string;
}

export class CreateMutabaahDto {
  @ApiProperty()
  @IsUUID()
  @IsNotEmpty()
  santriId: string;

  @ApiPropertyOptional()
  @IsDateString()
  @IsOptional()
  date?: string;

  @ApiPropertyOptional()
  @IsBoolean()
  @IsOptional()
  sholatWajib?: boolean;

  @ApiPropertyOptional()
  @IsBoolean()
  @IsOptional()
  tahajud?: boolean;

  @ApiPropertyOptional()
  @IsBoolean()
  @IsOptional()
  dhuha?: boolean;

  @ApiPropertyOptional()
  @IsBoolean()
  @IsOptional()
  puasaSunnah?: boolean;

  @ApiPropertyOptional()
  @IsBoolean()
  @IsOptional()
  bacaQuran?: boolean;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  notes?: string;
}
