import { IsString, IsNotEmpty, IsDateString, IsEnum, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateIzinDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  santriId: string;

  @ApiProperty({ enum: ['KELUAR', 'SAKIT', 'PULANG'] })
  @IsString()
  @IsNotEmpty()
  type: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  reason: string;

  @ApiProperty()
  @IsDateString()
  @IsNotEmpty()
  startAt: string;

  @ApiProperty()
  @IsDateString()
  @IsNotEmpty()
  endAt: string;
}

export class ApproveIzinDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  waliId: string;

  @ApiProperty({ enum: ['APPROVED', 'REJECTED'] })
  @IsString()
  @IsNotEmpty()
  status: string;

  // A secure token sent to the wali's WA for approval without login
  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  token?: string;
}
