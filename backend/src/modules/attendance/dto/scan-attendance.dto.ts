import { IsString, IsNotEmpty, IsOptional, IsNumber, Min, Max } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class ScanAttendanceDto {
  @ApiProperty({ example: 'uuid-qr-token', description: 'QR token dari sesi presensi' })
  @IsString()
  @IsNotEmpty()
  qrToken: string;

  @ApiProperty({ example: 'uuid-santri-id', description: 'ID santri yang melakukan presensi' })
  @IsString()
  @IsNotEmpty()
  santriId: string;

  @ApiPropertyOptional({ example: -6.2088, description: 'Latitude GPS santri (dari device)' })
  @IsOptional()
  @IsNumber()
  @Min(-90)
  @Max(90)
  gpsLat?: number;

  @ApiPropertyOptional({ example: 106.8456, description: 'Longitude GPS santri (dari device)' })
  @IsOptional()
  @IsNumber()
  @Min(-180)
  @Max(180)
  gpsLng?: number;

  @ApiPropertyOptional({ example: 15.5, description: 'Akurasi GPS dalam meter' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  gpsAccuracy?: number;

  @ApiPropertyOptional({ description: 'Client timestamp (DIABAIKAN — server_timestamp digunakan)' })
  @IsOptional()
  clientTimestamp?: string;
}
