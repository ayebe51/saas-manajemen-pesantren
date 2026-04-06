import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateAsramaDto {
  @ApiProperty({ description: 'Nama gedung asrama' })
  @IsString()
  @IsNotEmpty()
  nama: string;

  @ApiPropertyOptional({ description: 'Deskripsi asrama' })
  @IsString()
  @IsOptional()
  deskripsi?: string;
}
