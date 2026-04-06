import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsDateString, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class AssignSantriDto {
  @ApiProperty({ description: 'ID santri yang akan ditempatkan' })
  @IsString()
  @IsNotEmpty()
  santriId: string;

  @ApiProperty({ description: 'ID kamar tujuan' })
  @IsString()
  @IsNotEmpty()
  kamarId: string;

  @ApiPropertyOptional({ description: 'Tanggal masuk (default: sekarang)' })
  @IsDateString()
  @IsOptional()
  tanggalMasuk?: string;
}
