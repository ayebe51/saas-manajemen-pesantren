import {
  IsString,
  IsNotEmpty,
  IsArray,
  ValidateNested,
  IsOptional,
  IsEmail,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

class SyncSantriObj {
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

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  kelas?: string;

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
  @ApiProperty({ type: [SyncSantriObj] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SyncSantriObj)
  santri: SyncSantriObj[];
}
