import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsArray, IsEmail, IsNotEmpty, IsOptional, IsString, ValidateNested } from 'class-validator';

export class SyncSantriItemDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  nisn: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  gender: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  birthDate: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  birthPlace: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  address?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  waliName?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  waliPhone?: string;

  @ApiPropertyOptional()
  @IsEmail()
  @IsOptional()
  waliEmail?: string;
}

export class BulkSyncSantriDto {
  @ApiProperty({ type: [SyncSantriItemDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SyncSantriItemDto)
  data: SyncSantriItemDto[];
}
