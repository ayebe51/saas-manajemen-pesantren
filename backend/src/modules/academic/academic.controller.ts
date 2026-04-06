import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { TenantId } from '../../common/decorators/tenant-id.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { TenantGuard } from '../../common/guards/tenant.guard';
import { AcademicService } from './academic.service';
import {
  CreateBulkAttendanceDto,
  CreateGradeDto,
  CreateJadwalDto,
  CreateKelasDto,
  CreateMapelDto,
  CreateNilaiDto,
  CreateScheduleDto,
  UpdateKelasDto,
  UpdateMapelDto,
  UpdateNilaiDto,
} from './dto/academic.dto';

@ApiTags('Akademik')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, TenantGuard, RolesGuard)
@Controller('academic')
export class AcademicController {
  constructor(private readonly academicService: AcademicService) {}

  // ─── Kelas ──────────────────────────────────────────────────────────────────

  @Post('kelas')
  @Roles('SUPERADMIN', 'TENANT_ADMIN', 'PENGURUS')
  @ApiOperation({ summary: 'Buat kelas baru' })
  createKelas(@TenantId() tenantId: string, @Body() dto: CreateKelasDto) {
    return this.academicService.createKelas(tenantId, dto);
  }

  @Get('kelas')
  @Roles('SUPERADMIN', 'TENANT_ADMIN', 'PENGURUS', 'GURU', 'WALI', 'SANTRI')
  @ApiOperation({ summary: 'Daftar kelas' })
  @ApiQuery({ name: 'tahunAjaran', required: false })
  getKelasList(
    @TenantId() tenantId: string,
    @Query('tahunAjaran') tahunAjaran?: string,
  ) {
    return this.academicService.getKelasList(tenantId, tahunAjaran);
  }

  @Put('kelas/:id')
  @Roles('SUPERADMIN', 'TENANT_ADMIN', 'PENGURUS')
  @ApiOperation({ summary: 'Update data kelas' })
  updateKelas(
    @TenantId() tenantId: string,
    @Param('id') kelasId: string,
    @Body() dto: UpdateKelasDto,
  ) {
    return this.academicService.updateKelas(tenantId, kelasId, dto);
  }

  // ─── Mata Pelajaran ──────────────────────────────────────────────────────────

  @Post('mapel')
  @Roles('SUPERADMIN', 'TENANT_ADMIN', 'PENGURUS')
  @ApiOperation({ summary: 'Buat mata pelajaran baru' })
  createMapel(@TenantId() tenantId: string, @Body() dto: CreateMapelDto) {
    return this.academicService.createMapel(tenantId, dto);
  }

  @Get('mapel')
  @Roles('SUPERADMIN', 'TENANT_ADMIN', 'PENGURUS', 'GURU', 'WALI', 'SANTRI')
  @ApiOperation({ summary: 'Daftar mata pelajaran' })
  getMapelList(@TenantId() tenantId: string) {
    return this.academicService.getMapelList(tenantId);
  }

  @Put('mapel/:id')
  @Roles('SUPERADMIN', 'TENANT_ADMIN', 'PENGURUS')
  @ApiOperation({ summary: 'Update mata pelajaran' })
  updateMapel(
    @TenantId() tenantId: string,
    @Param('id') mapelId: string,
    @Body() dto: UpdateMapelDto,
  ) {
    return this.academicService.updateMapel(tenantId, mapelId, dto);
  }

  // ─── Jadwal Pelajaran ────────────────────────────────────────────────────────

  @Post('jadwal')
  @Roles('SUPERADMIN', 'TENANT_ADMIN', 'PENGURUS')
  @ApiOperation({ summary: 'Buat jadwal pelajaran — validasi konflik otomatis (Req 6.4)' })
  createJadwal(@TenantId() tenantId: string, @Body() dto: CreateJadwalDto) {
    return this.academicService.createJadwal(tenantId, dto);
  }

  @Get('jadwal/kelas/:kelasId')
  @Roles('SUPERADMIN', 'TENANT_ADMIN', 'PENGURUS', 'GURU', 'WALI', 'SANTRI')
  @ApiOperation({ summary: 'Jadwal pelajaran per kelas' })
  getJadwalByKelas(@TenantId() tenantId: string, @Param('kelasId') kelasId: string) {
    return this.academicService.getJadwalByKelas(tenantId, kelasId);
  }

  @Delete('jadwal/:id')
  @Roles('SUPERADMIN', 'TENANT_ADMIN', 'PENGURUS')
  @ApiOperation({ summary: 'Hapus jadwal pelajaran' })
  deleteJadwal(@TenantId() tenantId: string, @Param('id') jadwalId: string) {
    return this.academicService.deleteJadwal(tenantId, jadwalId);
  }

  // ─── Nilai Santri ────────────────────────────────────────────────────────────

  @Post('nilai')
  @Roles('SUPERADMIN', 'TENANT_ADMIN', 'PENGURUS', 'GURU')
  @ApiOperation({ summary: 'Input nilai santri — validasi rentang 0–100 (Req 6.2)' })
  createNilai(
    @TenantId() tenantId: string,
    @CurrentUser('userId') userId: string,
    @Body() dto: CreateNilaiDto,
  ) {
    return this.academicService.createNilai(tenantId, userId, dto);
  }

  @Put('nilai/:id')
  @Roles('SUPERADMIN', 'TENANT_ADMIN', 'PENGURUS', 'GURU')
  @ApiOperation({ summary: 'Update nilai santri' })
  updateNilai(
    @TenantId() tenantId: string,
    @Param('id') nilaiId: string,
    @Body() dto: UpdateNilaiDto,
  ) {
    return this.academicService.updateNilai(tenantId, nilaiId, dto);
  }

  @Get('nilai/santri/:santriId')
  @Roles('SUPERADMIN', 'TENANT_ADMIN', 'PENGURUS', 'GURU', 'WALI')
  @ApiOperation({ summary: 'Riwayat nilai santri' })
  @ApiQuery({ name: 'periode', required: false, example: 'GANJIL 2024/2025' })
  @ApiQuery({ name: 'mapelId', required: false })
  getNilaiBySantri(
    @TenantId() tenantId: string,
    @Param('santriId') santriId: string,
    @Query('periode') periode?: string,
    @Query('mapelId') mapelId?: string,
  ) {
    return this.academicService.getNilaiBySantri(tenantId, santriId, periode, mapelId);
  }

  @Get('nilai/santri/:santriId/rekap')
  @Roles('SUPERADMIN', 'TENANT_ADMIN', 'PENGURUS', 'GURU', 'WALI')
  @ApiOperation({ summary: 'Rekap rata-rata nilai per mata pelajaran (Req 6.3)' })
  @ApiQuery({ name: 'periode', required: true, example: 'GANJIL 2024/2025' })
  getRekap(
    @TenantId() tenantId: string,
    @Param('santriId') santriId: string,
    @Query('periode') periode: string,
  ) {
    return this.academicService.getRekap(tenantId, santriId, periode);
  }

  // ─── Legacy endpoints (backward compatibility) ────────────────────────────────

  @Post('schedule')
  @Roles('SUPERADMIN', 'TENANT_ADMIN', 'PENGURUS')
  @ApiOperation({ summary: '[Legacy] Membuat jadwal pelajaran' })
  createSchedule(@TenantId() tenantId: string, @Body() dto: CreateScheduleDto) {
    return this.academicService.createSchedule(tenantId, dto);
  }

  @Get('schedule/kelas/:kelas')
  @Roles('SUPERADMIN', 'TENANT_ADMIN', 'PENGURUS', 'GURU', 'WALI', 'SANTRI')
  @ApiOperation({ summary: '[Legacy] Jadwal pelajaran per kelas (string)' })
  getSchedule(@TenantId() tenantId: string, @Param('kelas') kelas: string) {
    return this.academicService.getScheduleByKelas(tenantId, kelas);
  }

  @Post('attendance')
  @Roles('SUPERADMIN', 'TENANT_ADMIN', 'PENGURUS', 'GURU')
  @ApiOperation({ summary: '[Legacy] Catat presensi santri (bulk)' })
  recordAttendance(
    @TenantId() tenantId: string,
    @CurrentUser('userId') userId: string,
    @Body() dto: CreateBulkAttendanceDto,
  ) {
    return this.academicService.recordAttendance(tenantId, userId, dto);
  }

  @Get('attendance/santri/:santriId')
  @Roles('SUPERADMIN', 'TENANT_ADMIN', 'PENGURUS', 'GURU', 'WALI')
  @ApiOperation({ summary: '[Legacy] Riwayat presensi santri' })
  getAttendance(@TenantId() tenantId: string, @Param('santriId') santriId: string) {
    return this.academicService.getAttendanceReport(tenantId, santriId);
  }

  @Post('grade')
  @Roles('SUPERADMIN', 'TENANT_ADMIN', 'PENGURUS', 'GURU')
  @ApiOperation({ summary: '[Legacy] Input nilai rapor santri' })
  createGrade(@TenantId() tenantId: string, @Body() dto: CreateGradeDto) {
    return this.academicService.createGrade(tenantId, dto);
  }

  @Get('grade/santri/:santriId')
  @Roles('SUPERADMIN', 'TENANT_ADMIN', 'PENGURUS', 'GURU', 'WALI')
  @ApiQuery({ name: 'semester', required: false })
  @ApiQuery({ name: 'academicYear', required: false })
  @ApiOperation({ summary: '[Legacy] Histori nilai rapor santri' })
  getGrade(
    @TenantId() tenantId: string,
    @Param('santriId') santriId: string,
    @Query('semester') semester?: string,
    @Query('academicYear') academicYear?: string,
  ) {
    return this.academicService.getGradeReport(tenantId, santriId, semester, academicYear);
  }
}
