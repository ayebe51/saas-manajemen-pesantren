import { IsString, IsNotEmpty, IsOptional, IsNumber, Min, Max } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateSessionDto {
  @ApiProperty({ example: 'Presensi Subuh', description: 'Nama sesi presensi' })
  @IsString()
  @IsNotEmpty()
  namaSesi: string;

  @ApiProperty({ example: 'MASUK', description: 'Tipe sesi: MASUK, KELUAR, SHOLAT, dll' })
  @IsString()
  @IsNotEmpty()
  tipe: string;

  @ApiPropertyOptional({ example: -6.2088, description: 'Latitude lokasi sesi' })
  @IsOptional()
  @IsNumber()
  @Min(-90)
  @Max(90)
  lokasiLat?: number;

  @ApiPropertyOptional({ example: 106.8456, description: 'Longitude lokasi sesi' })
  @IsOptional()
  @IsNumber()
  @Min(-180)
  @Max(180)
  lokasiLng?: number;

  @ApiPropertyOptional({ example: 100, description: 'Radius validasi GPS dalam meter (default: 100)' })
  @IsOptional()
  @IsNumber()
  @Min(1)
  radiusMeter?: number;
}
