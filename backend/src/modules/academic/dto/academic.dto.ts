import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
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

// ─── Kelas DTOs ───────────────────────────────────────────────────────────────

export class CreateKelasDto {
  @ApiProperty({ example: 'Kelas 7A' })
  @IsString()
  @IsNotEmpty()
  nama: string;

  @ApiPropertyOptional({ example: '7' })
  @IsString()
  @IsOptional()
  tingkat?: string;

  @ApiPropertyOptional({ description: 'User ID wali kelas' })
  @IsUUID()
  @IsOptional()
  waliKelasId?: string;

  @ApiPropertyOptional({ example: '2024/2025' })
  @IsString()
  @IsOptional()
  tahunAjaran?: string;
}

export class UpdateKelasDto {
  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  nama?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  tingkat?: string;

  @ApiPropertyOptional()
  @IsUUID()
  @IsOptional()
  waliKelasId?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  tahunAjaran?: string;

  @ApiPropertyOptional()
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}

// ─── Mata Pelajaran DTOs ──────────────────────────────────────────────────────

export class CreateMapelDto {
  @ApiProperty({ example: 'Matematika' })
  @IsString()
  @IsNotEmpty()
  nama: string;

  @ApiPropertyOptional({ example: 'MTK' })
  @IsString()
  @IsOptional()
  kode?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  deskripsi?: string;
}

export class UpdateMapelDto {
  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  nama?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  kode?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  deskripsi?: string;

  @ApiPropertyOptional()
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}

// ─── Jadwal Pelajaran DTOs ────────────────────────────────────────────────────

export class CreateJadwalDto {
  @ApiProperty({ description: 'ID Kelas' })
  @IsUUID()
  @IsNotEmpty()
  kelasId: string;

  @ApiProperty({ description: 'ID Mata Pelajaran' })
  @IsUUID()
  @IsNotEmpty()
  mapelId: string;

  @ApiProperty({ description: 'User ID pengajar' })
  @IsString()
  @IsNotEmpty()
  pengajarId: string;

  @ApiProperty({ description: '1=Senin, 2=Selasa, ..., 7=Ahad', minimum: 1, maximum: 7 })
  @IsNumber()
  @Min(1)
  @Max(7)
  hariKe: number;

  @ApiProperty({ example: '07:00' })
  @IsString()
  @IsNotEmpty()
  jamMulai: string;

  @ApiProperty({ example: '08:30' })
  @IsString()
  @IsNotEmpty()
  jamSelesai: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  ruangan?: string;
}

// ─── Nilai Santri DTOs ────────────────────────────────────────────────────────

export enum TipeNilai {
  UH = 'UH',
  UTS = 'UTS',
  UAS = 'UAS',
  PRAKTEK = 'PRAKTEK',
  TUGAS = 'TUGAS',
}

export class CreateNilaiDto {
  @ApiProperty({ description: 'ID Santri' })
  @IsUUID()
  @IsNotEmpty()
  santriId: string;

  @ApiProperty({ description: 'ID Mata Pelajaran' })
  @IsUUID()
  @IsNotEmpty()
  mapelId: string;

  @ApiPropertyOptional({ description: 'ID Kelas' })
  @IsUUID()
  @IsOptional()
  kelasId?: string;

  @ApiProperty({ example: 'GANJIL 2024/2025' })
  @IsString()
  @IsNotEmpty()
  periode: string;

  @ApiProperty({ enum: TipeNilai })
  @IsEnum(TipeNilai)
  tipeNilai: TipeNilai;

  @ApiProperty({ description: 'Nilai 0–100', minimum: 0, maximum: 100 })
  @IsNumber()
  @Min(0)
  @Max(100)
  nilai: number;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  keterangan?: string;
}

export class UpdateNilaiDto {
  @ApiPropertyOptional({ minimum: 0, maximum: 100 })
  @IsNumber()
  @Min(0)
  @Max(100)
  @IsOptional()
  nilai?: number;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  keterangan?: string;
}

// ─── Legacy DTOs (kept for backward compatibility) ────────────────────────────

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

  @ApiProperty({ description: 'UH, UTS, UAS, PRAKTEK, TUGAS' })
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
