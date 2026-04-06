import { IsString, IsNotEmpty, IsDateString, IsEnum } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export enum TipePerizinan {
  PULANG = 'PULANG',
  KELUAR_KOTA = 'KELUAR_KOTA',
  LAINNYA = 'LAINNYA',
}

export class CreatePerizinanDto {
  @ApiProperty({ description: 'ID santri yang mengajukan izin' })
  @IsString()
  @IsNotEmpty()
  santriId: string;

  @ApiProperty({ enum: TipePerizinan, description: 'Tipe izin: PULANG, KELUAR_KOTA, LAINNYA' })
  @IsEnum(TipePerizinan)
  tipe: TipePerizinan;

  @ApiProperty({ description: 'Alasan pengajuan izin' })
  @IsString()
  @IsNotEmpty()
  alasan: string;

  @ApiProperty({ description: 'Tanggal mulai izin (ISO 8601)' })
  @IsDateString()
  tanggalMulai: string;

  @ApiProperty({ description: 'Tanggal selesai izin (ISO 8601)' })
  @IsDateString()
  tanggalSelesai: string;
}
