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

export enum JabatanPegawai {
  GURU = 'GURU',
  MUSYRIF = 'MUSYRIF',
  STAF = 'STAF',
  SECURITY = 'SECURITY',
  KEPALA_SEKOLAH = 'KEPALA_SEKOLAH',
  BENDAHARA = 'BENDAHARA',
  LAINNYA = 'LAINNYA',
}

export enum StatusPresensiPegawai {
  HADIR = 'HADIR',
  IZIN = 'IZIN',
  SAKIT = 'SAKIT',
  ALPHA = 'ALPHA',
  TERLAMBAT = 'TERLAMBAT',
}

// ─── Pegawai DTOs ─────────────────────────────────────────────────────────────

export class CreatePegawaiDto {
  @ApiProperty({ description: 'Nama lengkap pegawai' })
  @IsString()
  @IsNotEmpty()
  nama: string;

  @ApiProperty({ enum: JabatanPegawai, description: 'Jabatan pegawai' })
  @IsEnum(JabatanPegawai)
  jabatan: JabatanPegawai;

  @ApiProperty({ description: 'Tanggal bergabung (ISO 8601)', example: '2024-01-15' })
  @IsDateString()
  tanggalBergabung: string;

  @ApiPropertyOptional({ description: 'UUID akun User untuk login (opsional)' })
  @IsUUID()
  @IsOptional()
  userId?: string;

  @ApiPropertyOptional({ description: 'Nomor Induk Pegawai' })
  @IsString()
  @IsOptional()
  nip?: string;

  @ApiPropertyOptional({ description: 'Nomor HP pegawai' })
  @IsString()
  @IsOptional()
  noHp?: string;

  @ApiPropertyOptional({ description: 'Alamat pegawai' })
  @IsString()
  @IsOptional()
  alamat?: string;

  @ApiPropertyOptional({ description: 'URL dokumen terkait (KTP, ijazah, dll)' })
  @IsString()
  @IsOptional()
  dokumenUrl?: string;
}

export class UpdatePegawaiDto {
  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  nama?: string;

  @ApiPropertyOptional({ enum: JabatanPegawai })
  @IsEnum(JabatanPegawai)
  @IsOptional()
  jabatan?: JabatanPegawai;

  @ApiPropertyOptional()
  @IsDateString()
  @IsOptional()
  tanggalBergabung?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  nip?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  noHp?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  alamat?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  dokumenUrl?: string;
}

export class DeactivatePegawaiDto {
  @ApiPropertyOptional({ description: 'Alasan penonaktifan pegawai' })
  @IsString()
  @IsOptional()
  alasan?: string;
}

// ─── Presensi Pegawai DTOs ────────────────────────────────────────────────────

export class CreatePresensiPegawaiDto {
  @ApiProperty({ description: 'UUID pegawai' })
  @IsUUID()
  pegawaiId: string;

  @ApiProperty({ description: 'Tanggal presensi (YYYY-MM-DD)', example: '2024-07-15' })
  @IsDateString()
  tanggal: string;

  @ApiProperty({ enum: StatusPresensiPegawai, description: 'Status kehadiran' })
  @IsEnum(StatusPresensiPegawai)
  status: StatusPresensiPegawai;

  @ApiPropertyOptional({ description: 'Jam masuk (ISO 8601)' })
  @IsDateString()
  @IsOptional()
  jamMasuk?: string;

  @ApiPropertyOptional({ description: 'Jam keluar (ISO 8601)' })
  @IsDateString()
  @IsOptional()
  jamKeluar?: string;

  @ApiPropertyOptional({ description: 'Keterangan tambahan' })
  @IsString()
  @IsOptional()
  keterangan?: string;
}

export class UpdatePresensiPegawaiDto {
  @ApiPropertyOptional({ enum: StatusPresensiPegawai })
  @IsEnum(StatusPresensiPegawai)
  @IsOptional()
  status?: StatusPresensiPegawai;

  @ApiPropertyOptional()
  @IsDateString()
  @IsOptional()
  jamMasuk?: string;

  @ApiPropertyOptional()
  @IsDateString()
  @IsOptional()
  jamKeluar?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  keterangan?: string;
}
