import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { IsDateString, IsEnum, IsNotEmpty, IsNumber, IsOptional, IsString } from 'class-validator';

export enum PpdbStatus {
  PENDING = 'PENDING',
  DOCUMENTS_VERIFIED = 'DOCUMENTS_VERIFIED',
  EXAM_SCHEDULED = 'EXAM_SCHEDULED',
  PASSED = 'PASSED',
  FAILED = 'FAILED',
  ACCEPTED = 'ACCEPTED',
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

export class CreatePpdbDto {
  @IsString()
  @IsNotEmpty()
  @ApiProperty()
  fullName: string;

  @IsString()
  @IsNotEmpty()
  @ApiProperty({ enum: ['L', 'P'] })
  gender: string;

  @IsDateString()
  @IsOptional()
  @ApiPropertyOptional()
  dob?: string;

  @IsString()
  @IsOptional()
  @ApiPropertyOptional()
  previousSchool?: string;

  @IsString()
  @IsOptional()
  @ApiPropertyOptional({ enum: ['REGULER', 'PRESTASI', 'MUTASI'], default: 'REGULER' })
  pathway?: string;

  @IsOptional()
  @ApiPropertyOptional({ type: [AddPpdbDocumentDto] })
  documents?: AddPpdbDocumentDto[];
}

export class UpdatePpdbDto extends PartialType(CreatePpdbDto) {
  @IsEnum(PpdbStatus)
  @IsOptional()
  @ApiPropertyOptional({ enum: PpdbStatus })
  status?: string;

  @IsString()
  @IsOptional()
  @ApiPropertyOptional()
  notes?: string;
}

export class AddPpdbExamDto {
  @IsString()
  @IsNotEmpty()
  @ApiProperty({ description: 'TES_TULIS, TES_WAWANCARA, TES_BACA_QURAN' })
  examType: string;

  @IsDateString()
  @IsNotEmpty()
  @ApiProperty()
  examDate: string;

  @IsNumber()
  @IsOptional()
  @ApiPropertyOptional()
  score?: number;

  @IsString()
  @IsOptional()
  @ApiPropertyOptional({ description: 'LULUS, TIDAK_LULUS' })
  result?: string;

  @IsString()
  @IsOptional()
  @ApiPropertyOptional()
  interviewer?: string;
}

