import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString, IsUUID } from 'class-validator';

export enum PpdbStatusUpdate {
  REVIEW = 'REVIEW',
  ACCEPTED = 'ACCEPTED',
  REJECTED = 'REJECTED',
}

/**
 * DTO untuk update status PPDB oleh admin.
 * Transisi yang valid: SUBMITTED → REVIEW → ACCEPTED/REJECTED
 * Requirements: 4.3, 4.4
 */
export class UpdatePpdbStatusDto {
  @ApiProperty({
    enum: PpdbStatusUpdate,
    description: 'Status baru: REVIEW, ACCEPTED, atau REJECTED',
  })
  @IsEnum(PpdbStatusUpdate)
  status: PpdbStatusUpdate;

  @ApiPropertyOptional({ description: 'Catatan reviewer (opsional)' })
  @IsString()
  @IsOptional()
  catatan?: string;

  @ApiPropertyOptional({ description: 'ID user yang mereview (UUID)' })
  @IsUUID()
  @IsOptional()
  reviewedBy?: string;
}
