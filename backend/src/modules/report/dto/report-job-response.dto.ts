import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class ReportJobResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  userId: string;

  @ApiProperty()
  tipe: string;

  @ApiProperty({ description: 'PENDING | PROCESSING | DONE | FAILED' })
  status: string;

  @ApiPropertyOptional()
  filter?: Record<string, unknown> | null;

  @ApiPropertyOptional()
  filePath?: string | null;

  @ApiPropertyOptional()
  errorMsg?: string | null;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
}
