import { IsString, IsOptional } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class CreateRekamMedisDto {
  @ApiPropertyOptional({ description: 'Riwayat penyakit santri' })
  @IsString()
  @IsOptional()
  riwayatPenyakit?: string;

  @ApiPropertyOptional({ description: 'Alergi yang dimiliki santri' })
  @IsString()
  @IsOptional()
  alergi?: string;

  @ApiPropertyOptional({ description: 'Catatan kesehatan tambahan' })
  @IsString()
  @IsOptional()
  catatan?: string;
}
