import { IsString, IsNotEmpty, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateCatatanDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  santriId: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  content: string;

  @ApiProperty({ description: 'Category e.g. Kehadiran, Prestasi, Sikap' })
  @IsString()
  @IsNotEmpty()
  category: string;

  @ApiPropertyOptional({ description: 'JSON string of attachments URLs' })
  @IsString()
  @IsOptional()
  attachments?: string;
}

export class CreatePengumumanDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  content: string;

  @ApiProperty({ description: 'Target audience e.g. ALL, KELAS_X, ASRAMA_A' })
  @IsString()
  @IsNotEmpty()
  audience: string;
}
