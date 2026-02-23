import { IsString, IsNotEmpty, IsOptional, IsBoolean } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateHealthRecordDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  santriId: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  symptoms: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  diagnosis?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  actionTaken?: string;

  @ApiPropertyOptional()
  @IsBoolean()
  @IsOptional()
  referred?: boolean;
}

export class CreateMedicationDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  santriId: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  medicineName: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  dose: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  schedule: string;
}
