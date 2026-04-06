import { IsOptional, IsString, IsDateString, IsInt, Min } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class QueryPerizinanDto {
  @ApiPropertyOptional({ description: 'Filter by santri ID' })
  @IsOptional()
  @IsString()
  santriId?: string;

  @ApiPropertyOptional({
    description: 'Filter by status',
    enum: ['DRAFT', 'SUBMITTED', 'APPROVED', 'REJECTED', 'COMPLETED', 'CANCELLED', 'TERLAMBAT'],
  })
  @IsOptional()
  @IsString()
  status?: string;

  @ApiPropertyOptional({ description: 'Filter tanggal mulai dari (ISO 8601)' })
  @IsOptional()
  @IsDateString()
  tanggalDari?: string;

  @ApiPropertyOptional({ description: 'Filter tanggal mulai sampai (ISO 8601)' })
  @IsOptional()
  @IsDateString()
  tanggalSampai?: string;

  @ApiPropertyOptional({ default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({ default: 20 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  limit?: number = 20;
}
