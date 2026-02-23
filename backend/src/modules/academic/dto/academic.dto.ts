import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsDateString,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  Min,
  ValidateNested,
} from 'class-validator';

export class CreateScheduleDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  subject: string;

  @ApiProperty({ description: 'Employee ID or NIP' })
  @IsString()
  @IsNotEmpty()
  teacherId: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  kelas: string;

  @ApiProperty({ description: '1=Monday, 2=Tuesday, etc' })
  @IsNumber()
  @Min(0)
  @Max(6)
  dayOfWeek: number;

  @ApiProperty({ description: 'Format "07:00"' })
  @IsString()
  @IsNotEmpty()
  startTime: string;

  @ApiProperty({ description: 'Format "08:30"' })
  @IsString()
  @IsNotEmpty()
  endTime: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  room?: string;
}

export enum AttendanceStatus {
  HADIR = 'HADIR',
  SAKIT = 'SAKIT',
  IZIN = 'IZIN',
  ALPA = 'ALPA',
}

export class StudentAttendanceDto {
  @ApiProperty()
  @IsUUID()
  @IsNotEmpty()
  santriId: string;

  @ApiProperty({ enum: AttendanceStatus })
  @IsEnum(AttendanceStatus)
  status: AttendanceStatus;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  notes?: string;
}

export class CreateBulkAttendanceDto {
  @ApiPropertyOptional()
  @IsUUID()
  @IsOptional()
  scheduleId?: string;

  @ApiPropertyOptional()
  @IsDateString()
  @IsOptional()
  date?: string;

  @ApiProperty({ type: [StudentAttendanceDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => StudentAttendanceDto)
  attendances: StudentAttendanceDto[];
}

export class CreateGradeDto {
  @ApiProperty()
  @IsUUID()
  @IsNotEmpty()
  santriId: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  subject: string;

  @ApiProperty({ description: 'GANJIL or GENAP' })
  @IsString()
  @IsNotEmpty()
  semester: string;

  @ApiProperty({ description: 'e.g 2024/2025' })
  @IsString()
  @IsNotEmpty()
  academicYear: string;

  @ApiProperty({ description: 'UH, UTS, UAS, PRAKTEK' })
  @IsString()
  @IsNotEmpty()
  type: string;

  @ApiProperty()
  @IsNumber()
  @Min(0)
  @Max(100)
  score: number;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  notes?: string;
}
