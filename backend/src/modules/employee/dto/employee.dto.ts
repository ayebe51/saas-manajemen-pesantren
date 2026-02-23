import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsDateString,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Min,
} from 'class-validator';

export enum EmployeePosition {
  GURU = 'GURU',
  MUSYRIF = 'MUSYRIF',
  STAF = 'STAF',
  SECURITY = 'SECURITY',
}

export class CreateEmployeeDto {
  @ApiPropertyOptional({ description: 'Penautan dengan Akun Auth (jika ia bisa login)' })
  @IsUUID()
  @IsOptional()
  userId?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  nip?: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ enum: EmployeePosition })
  @IsEnum(EmployeePosition)
  @IsNotEmpty()
  position: EmployeePosition;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  phone?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  address?: string;

  @ApiPropertyOptional()
  @IsDateString()
  @IsOptional()
  joinDate?: string;
}

export class CreatePayrollDto {
  @ApiProperty()
  @IsUUID()
  @IsNotEmpty()
  employeeId: string;

  @ApiProperty({ description: 'Bulan penggajian (1-12)' })
  @IsNumber()
  @Min(1)
  month: number;

  @ApiProperty({ description: 'Tahun penggajian (contoh: 2024)' })
  @IsNumber()
  year: number;

  @ApiProperty()
  @IsNumber()
  @Min(0)
  baseSalary: number;

  @ApiPropertyOptional()
  @IsNumber()
  @IsOptional()
  allowances?: number;

  @ApiPropertyOptional()
  @IsNumber()
  @IsOptional()
  deductions?: number;
}
