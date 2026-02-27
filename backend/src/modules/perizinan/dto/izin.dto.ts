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
  // id orang yang menyetujui (bisa ustaz, wali, poskestren)
  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  approverId?: string;

  // status baru (APPROVED_WAITING_CHECKOUT, PENDING_MUSYRIF, REJECTED)
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  status: string;

  // Catatan penolakan / persetujuan
  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  notes?: string;

  // A secure token sent to the wali's WA for approval without login
  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  token?: string;
}
