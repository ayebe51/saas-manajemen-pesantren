import { IsString, IsNotEmpty, IsDateString, IsNumber, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateKunjunganDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  santriId: string;

  @ApiProperty()
  @IsDateString()
  @IsNotEmpty()
  scheduledAt: string;

  @ApiProperty({ description: 'MORNING or AFTERNOON' })
  @IsString()
  @IsNotEmpty()
  slot: string;

  @ApiPropertyOptional()
  @IsNumber()
  @IsOptional()
  visitorLimit?: number;
}
