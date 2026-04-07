import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsDateString, IsInt, IsOptional, IsString, IsUUID, Max, Min } from 'class-validator';

export class QueryAuditLogDto {
  /** Jenis aksi, e.g. CREATE, UPDATE, DELETE, LOGIN */
  @ApiPropertyOptional({ description: 'Filter berdasarkan jenis aksi, e.g. CREATE, UPDATE, LOGIN' })
  @IsOptional()
  @IsString()
  aksi?: string;

  /** Nama modul, e.g. SANTRI, INVOICE, PERIZINAN */
  @ApiPropertyOptional({ description: 'Filter berdasarkan modul, e.g. SANTRI, INVOICE' })
  @IsOptional()
  @IsString()
  modul?: string;

  /** ID pengguna yang melakukan aksi */
  @ApiPropertyOptional({ description: 'Filter berdasarkan user_id pelaku aksi' })
  @IsOptional()
  @IsUUID()
  user_id?: string;

  /** Awal rentang waktu (ISO 8601) */
  @ApiPropertyOptional({ description: 'Awal rentang waktu, format ISO 8601 (e.g. 2024-01-01)' })
  @IsOptional()
  @IsDateString()
  startDate?: string;

  /** Akhir rentang waktu (ISO 8601) */
  @ApiPropertyOptional({ description: 'Akhir rentang waktu, format ISO 8601 (e.g. 2024-12-31)' })
  @IsOptional()
  @IsDateString()
  endDate?: string;

  /** Nomor halaman (default: 1) */
  @ApiPropertyOptional({ description: 'Nomor halaman', default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  /** Jumlah data per halaman (default: 50, max: 200) */
  @ApiPropertyOptional({ description: 'Jumlah data per halaman (max 200)', default: 50 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(200)
  limit?: number = 50;
}
