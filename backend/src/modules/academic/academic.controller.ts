import { Body, Controller, Get, Param, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { TenantId } from '../../common/decorators/tenant-id.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { TenantGuard } from '../../common/guards/tenant.guard';
import { AcademicService } from './academic.service';
import { CreateBulkAttendanceDto, CreateGradeDto, CreateScheduleDto } from './dto/academic.dto';

@ApiTags('Akademik & Rapor')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, TenantGuard, RolesGuard)
@Controller('api/v1/academic')
export class AcademicController {
  constructor(private readonly academicService: AcademicService) {}

  @Post('schedule')
  @Roles('SUPERADMIN', 'TENANT_ADMIN', 'PENGURUS')
  @ApiOperation({ summary: 'Membuat jadwal pelajaran baru' })
  async createSchedule(@TenantId() tenantId: string, @Body() dto: CreateScheduleDto) {
    return this.academicService.createSchedule(tenantId, dto);
  }

  @Get('schedule/kelas/:kelas')
  @Roles('SUPERADMIN', 'TENANT_ADMIN', 'PENGURUS', 'GURU', 'WALI', 'SANTRI')
  @ApiOperation({ summary: 'Melihat jadwal lengkap pelajaran 1 kelas' })
  async getSchedule(@TenantId() tenantId: string, @Param('kelas') kelas: string) {
    return this.academicService.getScheduleByKelas(tenantId, kelas);
  }

  @Post('attendance')
  @Roles('SUPERADMIN', 'TENANT_ADMIN', 'PENGURUS', 'GURU')
  @ApiOperation({ summary: 'Mencatat presensi santri sekolah (Bulk/Satu Kelas)' })
  async recordAttendance(
    @TenantId() tenantId: string,
    @CurrentUser('userId') userId: string,
    @Body() dto: CreateBulkAttendanceDto,
  ) {
    return this.academicService.recordAttendance(tenantId, userId, dto);
  }

  @Get('attendance/santri/:santriId')
  @Roles('SUPERADMIN', 'TENANT_ADMIN', 'PENGURUS', 'GURU', 'WALI')
  @ApiOperation({ summary: 'Melihat rekap riwayat presensi satu orang santri' })
  async getAttendance(@TenantId() tenantId: string, @Param('santriId') santriId: string) {
    return this.academicService.getAttendanceReport(tenantId, santriId);
  }

  @Post('grade')
  @Roles('SUPERADMIN', 'TENANT_ADMIN', 'PENGURUS', 'GURU')
  @ApiOperation({ summary: 'Memasukkan data nilai prestasi / rapor santri' })
  async createGrade(@TenantId() tenantId: string, @Body() dto: CreateGradeDto) {
    return this.academicService.createGrade(tenantId, dto);
  }

  @Get('grade/santri/:santriId')
  @Roles('SUPERADMIN', 'TENANT_ADMIN', 'PENGURUS', 'GURU', 'WALI')
  @ApiQuery({ name: 'semester', required: false, description: 'Filter by GANJIL/GENAP' })
  @ApiQuery({ name: 'academicYear', required: false, description: 'Filter by year e.g 2024/2025' })
  @ApiOperation({ summary: 'Melihat histori nilai rapor sekolah santri' })
  async getGrade(
    @TenantId() tenantId: string,
    @Param('santriId') santriId: string,
    @Query('semester') semester?: string,
    @Query('academicYear') academicYear?: string,
  ) {
    return this.academicService.getGradeReport(tenantId, santriId, semester, academicYear);
  }
}
