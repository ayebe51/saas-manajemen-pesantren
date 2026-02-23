import { IsString, IsNotEmpty, IsOptional, IsEnum, IsDateString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateSantriDto {
  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  nisn?: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ enum: ['L', 'P'] })
  @IsString()
  @IsNotEmpty()
  gender: string;

  @ApiPropertyOptional()
  @IsDateString()
  @IsOptional()
  dob?: Date;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  kelas?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  room?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  contact?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  address?: string;
}

export class UpdateSantriDto {
  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  name?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  kelas?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  room?: string;

  @ApiPropertyOptional({ enum: ['AKTIF', 'LULUS', 'MUTASI', 'NONAKTIF'] })
  @IsString()
  @IsOptional()
  status?: string;
}

export class CreateWaliDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  relation: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  phone: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  email?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  address?: string;
}
