import {
  IsString,
  IsNotEmpty,
  IsDateString,
  IsNumber,
  IsOptional,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

// ─── Existing Kunjungan (Visit Scheduling) DTOs ───────────────────────────────

export class CreateKunjunganDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  santriId: string;

  @ApiProperty()
  @IsDateString()
  @IsNotEmpty()
  scheduledAt: string;

  @ApiProperty({ description: 'MORNING or AFTERNOON' })
  @IsString()
  @IsNotEmpty()
  slot: string;

  @ApiPropertyOptional()
  @IsNumber()
  @IsOptional()
  visitorLimit?: number;
}

// ─── KunjunganTamu (Guest Visit Recording) DTOs ───────────────────────────────
// Requirements: 10.1

export class CreateKunjunganTamuDto {
  @ApiProperty({ description: 'ID santri yang dikunjungi' })
  @IsString()
  @IsNotEmpty()
  santriId: string;

  @ApiProperty({ description: 'Nama lengkap tamu' })
  @IsString()
  @IsNotEmpty()
  namaTamu: string;

  @ApiProperty({ description: 'Hubungan tamu dengan santri (Ayah, Ibu, Kakak, dll)' })
  @IsString()
  @IsNotEmpty()
  hubungan: string;

  @ApiPropertyOptional({ description: 'Waktu masuk (default: server timestamp)' })
  @IsDateString()
  @IsOptional()
  waktuMasuk?: string;

  @ApiPropertyOptional({ description: 'Keterangan tambahan' })
  @IsString()
  @IsOptional()
  keterangan?: string;
}

export class CheckoutKunjunganTamuDto {
  @ApiPropertyOptional({ description: 'Waktu keluar (default: server timestamp)' })
  @IsDateString()
  @IsOptional()
  waktuKeluar?: string;
}

export class QueryKunjunganTamuDto {
  @ApiPropertyOptional({ description: 'Filter by santriId' })
  @IsString()
  @IsOptional()
  santriId?: string;

  @ApiPropertyOptional({ description: 'Filter tanggal mulai (YYYY-MM-DD)' })
  @IsDateString()
  @IsOptional()
  tanggalDari?: string;

  @ApiPropertyOptional({ description: 'Filter tanggal akhir (YYYY-MM-DD)' })
  @IsDateString()
  @IsOptional()
  tanggalSampai?: string;
}
