import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { TenantId } from '../../common/decorators/tenant-id.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { TenantGuard } from '../../common/guards/tenant.guard';
import {
  CreatePegawaiDto,
  CreatePresensiPegawaiDto,
  DeactivatePegawaiDto,
  UpdatePegawaiDto,
  UpdatePresensiPegawaiDto,
} from './dto/kepegawaian.dto';
import { KepegawaianService } from './kepegawaian.service';

@ApiTags('Kepegawaian (HR)')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, TenantGuard, RolesGuard)
@Controller('kepegawaian')
export class KepegawaianController {
  constructor(private readonly kepegawaianService: KepegawaianService) {}

  // ─── Pegawai ──────────────────────────────────────────────────────────────

  @Post('pegawai')
  @Roles('SUPERADMIN', 'TENANT_ADMIN', 'PENGURUS')
  @ApiOperation({ summary: 'Tambah data pegawai baru' })
  async createPegawai(
    @TenantId() tenantId: string,
    @Body() dto: CreatePegawaiDto,
    @CurrentUser() user: any,
  ) {
    return this.kepegawaianService.createPegawai(tenantId, dto, user?.id);
  }

  @Get('pegawai')
  @Roles('SUPERADMIN', 'TENANT_ADMIN', 'PENGURUS')
  @ApiOperation({ summary: 'Daftar semua pegawai' })
  @ApiQuery({ name: 'includeInactive', required: false, type: Boolean })
  async findAllPegawai(
    @TenantId() tenantId: string,
    @Query('includeInactive') includeInactive?: string,
  ) {
    return this.kepegawaianService.findAllPegawai(tenantId, includeInactive === 'true');
  }

  @Get('pegawai/:id')
  @Roles('SUPERADMIN', 'TENANT_ADMIN', 'PENGURUS')
  @ApiOperation({ summary: 'Detail data pegawai' })
  async findOnePegawai(@TenantId() tenantId: string, @Param('id') id: string) {
    return this.kepegawaianService.findOnePegawai(tenantId, id);
  }

  @Patch('pegawai/:id')
  @Roles('SUPERADMIN', 'TENANT_ADMIN', 'PENGURUS')
  @ApiOperation({ summary: 'Update data pegawai' })
  async updatePegawai(
    @TenantId() tenantId: string,
    @Param('id') id: string,
    @Body() dto: UpdatePegawaiDto,
    @CurrentUser() user: any,
  ) {
    return this.kepegawaianService.updatePegawai(tenantId, id, dto, user?.id);
  }

  @Post('pegawai/:id/deactivate')
  @Roles('SUPERADMIN', 'TENANT_ADMIN', 'PENGURUS')
  @ApiOperation({
    summary: 'Nonaktifkan pegawai dan cabut semua sesi login secara bersamaan',
    description:
      'Menonaktifkan akun pegawai dan mencabut semua refresh token aktif milik user yang terhubung (Requirement 16.2)',
  })
  async deactivatePegawai(
    @TenantId() tenantId: string,
    @Param('id') id: string,
    @Body() dto: DeactivatePegawaiDto,
    @CurrentUser() user: any,
  ) {
    return this.kepegawaianService.deactivatePegawai(tenantId, id, dto, user?.id);
  }

  @Delete('pegawai/:id')
  @Roles('SUPERADMIN', 'TENANT_ADMIN')
  @ApiOperation({ summary: 'Hapus data pegawai (soft delete)' })
  async deletePegawai(
    @TenantId() tenantId: string,
    @Param('id') id: string,
    @CurrentUser() user: any,
  ) {
    return this.kepegawaianService.deletePegawai(tenantId, id, user?.id);
  }

  // ─── Presensi Pegawai ─────────────────────────────────────────────────────

  @Post('presensi')
  @Roles('SUPERADMIN', 'TENANT_ADMIN', 'PENGURUS')
  @ApiOperation({ summary: 'Catat presensi pegawai (terpisah dari presensi santri)' })
  async createPresensi(
    @TenantId() tenantId: string,
    @Body() dto: CreatePresensiPegawaiDto,
    @CurrentUser() user: any,
  ) {
    return this.kepegawaianService.createPresensi(tenantId, dto, user?.id);
  }

  @Get('presensi/pegawai/:pegawaiId')
  @Roles('SUPERADMIN', 'TENANT_ADMIN', 'PENGURUS')
  @ApiOperation({ summary: 'Riwayat presensi seorang pegawai' })
  @ApiQuery({ name: 'bulan', required: false, type: Number, description: '1-12' })
  @ApiQuery({ name: 'tahun', required: false, type: Number })
  async findPresensiByPegawai(
    @TenantId() tenantId: string,
    @Param('pegawaiId') pegawaiId: string,
    @Query('bulan') bulan?: string,
    @Query('tahun') tahun?: string,
  ) {
    return this.kepegawaianService.findPresensiByPegawai(
      tenantId,
      pegawaiId,
      bulan ? parseInt(bulan, 10) : undefined,
      tahun ? parseInt(tahun, 10) : undefined,
    );
  }

  @Patch('presensi/:presensiId')
  @Roles('SUPERADMIN', 'TENANT_ADMIN', 'PENGURUS')
  @ApiOperation({ summary: 'Update catatan presensi pegawai' })
  async updatePresensi(
    @TenantId() tenantId: string,
    @Param('presensiId') presensiId: string,
    @Body() dto: UpdatePresensiPegawaiDto,
    @CurrentUser() user: any,
  ) {
    return this.kepegawaianService.updatePresensi(tenantId, presensiId, dto, user?.id);
  }

  @Get('presensi/rekap')
  @Roles('SUPERADMIN', 'TENANT_ADMIN', 'PENGURUS')
  @ApiOperation({ summary: 'Rekap presensi semua pegawai per bulan' })
  @ApiQuery({ name: 'bulan', required: true, type: Number })
  @ApiQuery({ name: 'tahun', required: true, type: Number })
  async getRekapPresensi(
    @TenantId() tenantId: string,
    @Query('bulan') bulan: string,
    @Query('tahun') tahun: string,
  ) {
    return this.kepegawaianService.getRekapPresensi(
      tenantId,
      parseInt(bulan, 10),
      parseInt(tahun, 10),
    );
  }
}
