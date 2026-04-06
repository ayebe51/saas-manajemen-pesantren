import { IsString, IsNotEmpty, IsOptional, IsBoolean, IsUUID } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateKunjunganDto {
  @ApiProperty({ description: 'ID santri yang berkunjung ke klinik' })
  @IsUUID()
  @IsNotEmpty()
  santriId: string;

  @ApiProperty({ description: 'Keluhan yang disampaikan santri' })
  @IsString()
  @IsNotEmpty()
  keluhan: string;

  @ApiPropertyOptional({ description: 'Diagnosis dari petugas kesehatan' })
  @IsString()
  @IsOptional()
  diagnosis?: string;

  @ApiPropertyOptional({ description: 'Tindakan yang diberikan' })
  @IsString()
  @IsOptional()
  tindakan?: string;

  @ApiPropertyOptional({
    description: 'Tandai jika santri perlu perhatian khusus — akan mengirim notifikasi WA ke wali',
    default: false,
  })
  @IsBoolean()
  @IsOptional()
  perlu_perhatian_khusus?: boolean;
}
