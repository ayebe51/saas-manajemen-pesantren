import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { IsDateString, IsEnum, IsNotEmpty, IsNumber, IsOptional, IsString } from 'class-validator';

enum PpdbStatus {
  PENDING = 'PENDING',
  DOCUMENTS_VERIFIED = 'DOCUMENTS_VERIFIED',
  EXAM_SCHEDULED = 'EXAM_SCHEDULED',
  PASSED = 'PASSED',
  FAILED = 'FAILED',
  ACCEPTED = 'ACCEPTED',
}

export class CreatePpdbDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  fullName: string;

  @ApiProperty({ enum: ['L', 'P'] })
  @IsString()
  @IsNotEmpty()
  gender: string;

  @ApiPropertyOptional()
  @IsDateString()
  @IsOptional()
  dob?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  previousSchool?: string;

  @ApiPropertyOptional({ enum: ['REGULER', 'PRESTASI', 'MUTASI'], default: 'REGULER' })
  @IsString()
  @IsOptional()
  pathway?: string;
}

export class UpdatePpdbDto extends PartialType(CreatePpdbDto) {
  @ApiPropertyOptional({ enum: PpdbStatus })
  @IsEnum(PpdbStatus)
  @IsOptional()
  status?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  notes?: string;
}

export class AddPpdbDocumentDto {
  @ApiProperty({ description: 'Tipe Dokumen: KK, AKTA, IJAZAH, PASFOTO' })
  @IsString()
  @IsNotEmpty()
  documentType: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  fileUrl: string;
}

export class AddPpdbExamDto {
  @ApiProperty({ description: 'TES_TULIS, TES_WAWANCARA, TES_BACA_QURAN' })
  @IsString()
  @IsNotEmpty()
  examType: string;

  @ApiProperty()
  @IsDateString()
  @IsNotEmpty()
  examDate: string;

  @ApiPropertyOptional()
  @IsNumber()
  @IsOptional()
  score?: number;

  @ApiPropertyOptional({ description: 'LULUS, TIDAK_LULUS' })
  @IsString()
  @IsOptional()
  result?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  interviewer?: string;
}
