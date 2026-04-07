import { IsEnum, IsOptional, IsString, IsDateString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export enum TipeLaporan {
  SANTRI = 'SANTRI',
  PRESENSI = 'PRESENSI',
  KEUANGAN = 'KEUANGAN',
  PELANGGARAN = 'PELANGGARAN',
  KESEHATAN = 'KESEHATAN',
  KUNJUNGAN = 'KUNJUNGAN',
  ASRAMA = 'ASRAMA',
  KEPEGAWAIAN = 'KEPEGAWAIAN',
  KOPERASI = 'KOPERASI',
}

export enum FormatLaporan {
  PDF = 'PDF',
  EXCEL = 'EXCEL',
}

export class GenerateReportDto {
  @ApiProperty({ enum: TipeLaporan, description: 'Jenis laporan yang akan digenerate' })
  @IsEnum(TipeLaporan)
  tipe: TipeLaporan;

  @ApiProperty({ enum: FormatLaporan, description: 'Format output laporan' })
  @IsEnum(FormatLaporan)
  format: FormatLaporan;

  @ApiPropertyOptional({ description: 'Tanggal mulai filter (ISO 8601)' })
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiPropertyOptional({ description: 'Tanggal akhir filter (ISO 8601)' })
  @IsOptional()
  @IsDateString()
  endDate?: string;

  @ApiPropertyOptional({ description: 'Filter berdasarkan ID kelas' })
  @IsOptional()
  @IsString()
  kelasId?: string;

  @ApiPropertyOptional({ description: 'Filter berdasarkan ID asrama' })
  @IsOptional()
  @IsString()
  asramaId?: string;
}
