import { IsString, IsNotEmpty, IsNumber, IsOptional, IsBoolean } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreatePelanggaranDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  santriId: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  category: string; // RINGAN, SEDANG, BERAT

  @ApiProperty()
  @IsNumber()
  @IsNotEmpty()
  severity: number; // 1-5

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  description: string;
}

export class CreatePembinaanDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  santriId: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  plan: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  targetDate: string; // ISO Date

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  assignedTo: string; // User ID
}
