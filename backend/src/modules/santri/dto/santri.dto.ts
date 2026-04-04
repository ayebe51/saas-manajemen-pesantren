import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsDateString,
  IsIn,
  IsInt,
  Min,
  IsEmail,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class CreateSantriDto {
  @ApiPropertyOptional({ description: 'Nomor Induk Santri — harus unik' })
  @IsString()
  @IsOptional()
  nis?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  nisn?: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  namaLengkap?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  namaPanggilan?: string;

  @ApiProperty({ enum: ['L', 'P'] })
  @IsString()
  @IsNotEmpty()
  gender: string;

  @ApiPropertyOptional({ enum: ['L', 'P'] })
  @IsString()
  @IsOptional()
  jenisKelamin?: string;

  @ApiPropertyOptional()
  @IsDateString()
  @IsOptional()
  dob?: Date;

  @ApiPropertyOptional()
  @IsDateString()
  @IsOptional()
  tanggalLahir?: Date;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  tempatLahir?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  kelas?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  room?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  contact?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  noHp?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  address?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  alamat?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  photo?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  fotoUrl?: string;

  @ApiPropertyOptional()
  @IsDateString()
  @IsOptional()
  tanggalMasuk?: Date;

  @ApiPropertyOptional({ enum: ['AKTIF', 'ALUMNI', 'KELUAR'] })
  @IsString()
  @IsOptional()
  @IsIn(['AKTIF', 'ALUMNI', 'KELUAR'])
  status?: string;
}

export class UpdateSantriDto {
  @ApiPropertyOptional({ description: 'Nomor Induk Santri — harus unik' })
  @IsString()
  @IsOptional()
  nis?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  name?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  namaLengkap?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  namaPanggilan?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  kelas?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  room?: string;

  @ApiPropertyOptional({ enum: ['AKTIF', 'ALUMNI', 'KELUAR'] })
  @IsString()
  @IsOptional()
  @IsIn(['AKTIF', 'ALUMNI', 'KELUAR'])
  status?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  contact?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  noHp?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  address?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  alamat?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  photo?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  fotoUrl?: string;

  @ApiPropertyOptional()
  @IsDateString()
  @IsOptional()
  tanggalMasuk?: Date;

  @ApiPropertyOptional()
  @IsDateString()
  @IsOptional()
  tanggalKeluar?: Date;
}

export class CreateWaliDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  namaLengkap?: string;

  @ApiProperty({ description: 'Hubungan dengan santri: Ayah, Ibu, Wali, dll' })
  @IsString()
  @IsNotEmpty()
  relation: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  hubungan?: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  phone: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  noHp?: string;

  @ApiPropertyOptional()
  @IsEmail()
  @IsOptional()
  email?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  address?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  alamat?: string;
}

export class SantriFilterDto {
  @ApiPropertyOptional({ default: 1 })
  @IsInt()
  @Min(1)
  @IsOptional()
  @Type(() => Number)
  page?: number;

  @ApiPropertyOptional({ default: 10 })
  @IsInt()
  @Min(1)
  @IsOptional()
  @Type(() => Number)
  limit?: number;

  @ApiPropertyOptional({ description: 'Cari berdasarkan nama, NIS, NISN, atau kelas' })
  @IsString()
  @IsOptional()
  search?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  kelas?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  room?: string;

  @ApiPropertyOptional({ enum: ['AKTIF', 'ALUMNI', 'KELUAR'] })
  @IsString()
  @IsOptional()
  status?: string;

  @ApiPropertyOptional({ description: 'Filter santri berdasarkan userId wali' })
  @IsString()
  @IsOptional()
  waliId?: string;
}
