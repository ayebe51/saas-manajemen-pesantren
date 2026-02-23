import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { IsDateString, IsEnum, IsNotEmpty, IsNumber, IsOptional, IsString } from 'class-validator';

export class CreateBuildingDto {
  @ApiProperty() @IsString() @IsNotEmpty() name: string;
  @ApiPropertyOptional() @IsString() @IsOptional() description?: string;
  @ApiProperty({ description: 'Gender peruntukan: L/P' }) @IsString() @IsNotEmpty() gender: string;
  @ApiPropertyOptional() @IsNumber() @IsOptional() capacity?: number;
}

export class UpdateBuildingDto extends PartialType(CreateBuildingDto) {}

export class CreateRoomDto {
  @ApiProperty() @IsString() @IsNotEmpty() buildingId: string;
  @ApiProperty() @IsString() @IsNotEmpty() name: string;
  @ApiProperty() @IsNumber() @IsNotEmpty() capacity: number;
  @ApiPropertyOptional() @IsString() @IsOptional() picName?: string;
}

export class UpdateRoomDto extends PartialType(CreateRoomDto) {}

export class AssignRoomDto {
  @ApiProperty() @IsString() @IsNotEmpty() santriId: string;
  @ApiPropertyOptional() @IsDateString() @IsOptional() startDate?: string;
}

export class CheckoutRoomDto {
  @ApiPropertyOptional({ description: 'MOVED, GRADUATED' })
  @IsString()
  @IsOptional()
  status?: string;

  @ApiProperty()
  @IsDateString()
  @IsNotEmpty()
  endDate: string;
}

export class CreateMaintenanceTicketDto {
  @ApiProperty() @IsString() @IsNotEmpty() roomId: string;
  @ApiProperty() @IsString() @IsNotEmpty() title: string;
  @ApiProperty() @IsString() @IsNotEmpty() description: string;
  @ApiPropertyOptional({ description: 'LOW, MEDIUM, HIGH, CRITICAL' })
  @IsString()
  @IsOptional()
  priority?: string;
}

export class UpdateMaintenanceTicketDto extends PartialType(CreateMaintenanceTicketDto) {
  @ApiPropertyOptional({ description: 'OPEN, IN_PROGRESS, RESOLVED, CLOSED' })
  @IsString()
  @IsOptional()
  status?: string;

  @ApiPropertyOptional()
  @IsDateString()
  @IsOptional()
  resolvedAt?: string;
}
