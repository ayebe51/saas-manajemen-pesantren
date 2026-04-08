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
  @ApiProperty({ description: 'ID santri yang melakukan setoran hafalan' })
  @IsUUID()
  @IsNotEmpty()
  santriId: string;

  @ApiProperty({ description: 'Nama surah atau juz yang dihafalkan' })
  @IsString()
  @IsNotEmpty()
  surah: string;

  @ApiPropertyOptional({ description: 'Ayat atau halaman yang dihafalkan' })
  @IsString()
  @IsOptional()
  ayat?: string;

  @ApiProperty({
    enum: TahfidzType,
    description: 'Tipe setoran: ZIYADAH (hafalan baru), MUROJAAH (ulangan), SABAQ',
  })
  @IsEnum(TahfidzType)
  @IsNotEmpty()
  type: TahfidzType;

  @ApiPropertyOptional({
    description: 'Predikat hafalan: MUMTAZ (Sangat Baik), LANCAR (Jiyyad), CUKUP (Maqbul), KURANG (Perlu Diulang)',
  })
  @IsString()
  @IsOptional()
  grade?: string;

  @ApiPropertyOptional({ description: 'Catatan tambahan tentang hafalan (tajwid, makhraj, dll)' })
  @IsString()
  @IsOptional()
  notes?: string;

  @ApiPropertyOptional({
    description: 'Tanggal setoran hafalan (ISO 8601 format, default: hari ini)',
  })
  @IsDateString()
  @IsOptional()
  date?: string;
}

export class CreateMutabaahDto {
  @ApiProperty({ description: 'ID santri untuk pencatatan mutabaah harian' })
  @IsUUID()
  @IsNotEmpty()
  santriId: string;

  @ApiPropertyOptional({
    description: 'Tanggal mutabaah (ISO 8601 format, default: hari ini)',
  })
  @IsDateString()
  @IsOptional()
  date?: string;

  @ApiPropertyOptional({
    description: 'Status sholat wajib (default: true)',
  })
  @IsBoolean()
  @IsOptional()
  sholatWajib?: boolean;

  @ApiPropertyOptional({
    description: 'Status tahajud (default: false)',
  })
  @IsBoolean()
  @IsOptional()
  tahajud?: boolean;

  @ApiPropertyOptional({
    description: 'Status sholat dhuha (default: false)',
  })
  @IsBoolean()
  @IsOptional()
  dhuha?: boolean;

  @ApiPropertyOptional({
    description: 'Status puasa sunnah (default: false)',
  })
  @IsBoolean()
  @IsOptional()
  puasaSunnah?: boolean;

  @ApiPropertyOptional({
    description: 'Status baca Quran (default: true)',
  })
  @IsBoolean()
  @IsOptional()
  bacaQuran?: boolean;

  @ApiPropertyOptional({
    description: 'Catatan tambahan untuk mutabaah harian',
  })
  @IsString()
  @IsOptional()
  notes?: string;
}
