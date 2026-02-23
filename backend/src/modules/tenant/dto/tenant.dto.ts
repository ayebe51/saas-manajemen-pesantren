import { IsEmail, IsEnum, IsNotEmpty, IsOptional, IsString, IsObject } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateTenantDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  address?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  phone?: string;
  
  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  timezone?: string;

  @ApiPropertyOptional({ enum: ['BASIC', 'PRO', 'ENTERPRISE'] })
  @IsString()
  @IsOptional()
  plan?: string;
}

export class UpdateTenantDto {
  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  name?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  address?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  phone?: string;
  
  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  billingContact?: string;
  
  @ApiPropertyOptional({ enum: ['ACTIVE', 'SUSPENDED', 'INACTIVE'] })
  @IsString()
  @IsOptional()
  status?: string;

  @ApiPropertyOptional({ enum: ['BASIC', 'PRO', 'ENTERPRISE'] })
  @IsString()
  @IsOptional()
  plan?: string;

  @ApiPropertyOptional()
  @IsObject()
  @IsOptional()
  settings?: any;
}
