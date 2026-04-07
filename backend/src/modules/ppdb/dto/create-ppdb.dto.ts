import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsObject, IsNotEmpty, IsOptional, IsString } from 'class-validator';

/**
 * DTO untuk membuat pendaftaran PPDB baru.
 * `dataCaon` adalah JSONB yang berisi data calon santri.
 * Requirements: 4.1, 4.2
 */
export class CreatePpdbDto {
  /**
   * Data calon santri dalam format JSON.
   * Minimal harus mengandung: nama_lengkap, no_hp_wali.
   * Opsional: jenis_kelamin, tanggal_lahir, tempat_lahir, alamat, foto_url, dll.
   */
  @ApiProperty({
    description: 'Data calon santri (JSONB). Wajib: nama_lengkap, no_hp_wali.',
    example: {
      nama_lengkap: 'Ahmad Fulan',
      no_hp_wali: '081234567890',
      jenis_kelamin: 'L',
      tanggal_lahir: '2010-05-15',
      tempat_lahir: 'Bandung',
      alamat: 'Jl. Raya Pesantren No. 1',
    },
  })
  @IsObject()
  @IsNotEmpty()
  dataCalon: Record<string, any>;

  @ApiPropertyOptional({ description: 'Catatan tambahan (opsional)' })
  @IsString()
  @IsOptional()
  catatan?: string;
}
