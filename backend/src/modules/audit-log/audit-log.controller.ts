import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Roles } from '../../common/decorators/roles.decorator';
import { TenantId } from '../../common/decorators/tenant-id.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { AuditLogService } from './audit-log.service';
import { QueryAuditLogDto } from './dto/query-audit-log.dto';

/**
 * AuditLogController — endpoint query audit log
 * Akses hanya untuk Super_Admin dan Owner (Requirement 20.5)
 */
@ApiTags('Audit Logs')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('audit-logs')
export class AuditLogController {
  constructor(private readonly auditLogService: AuditLogService) {}

  /**
   * GET /audit-logs
   * Req 20.5 — Filter berdasarkan jenis aksi, rentang waktu, dan identitas pengguna
   * Akses: Super_Admin, Owner
   */
  @Get()
  @Roles('Super_Admin', 'Owner', 'SUPERADMIN')
  @ApiOperation({
    summary: 'Daftar audit log dengan filter',
    description:
      'Menampilkan riwayat audit log dengan filter jenis aksi, modul, rentang waktu, dan user_id. Hanya dapat diakses oleh Super_Admin dan Owner.',
  })
  async findAll(
    @TenantId() tenantId: string,
    @Query() query: QueryAuditLogDto,
  ) {
    return this.auditLogService.findAll(
      tenantId,
      query.limit ?? 50,
      query.aksi,
      query.modul,
      query.user_id,
      query.startDate,
      query.endDate,
      query.page ?? 1,
    );
  }

  /**
   * GET /audit-logs/:id
   * Detail satu entri audit log
   * Akses: Super_Admin, Owner
   */
  @Get(':id')
  @Roles('Super_Admin', 'Owner', 'SUPERADMIN')
  @ApiOperation({ summary: 'Detail satu entri audit log' })
  async findOne(@TenantId() tenantId: string, @Param('id') id: string) {
    return this.auditLogService.findOne(tenantId, id);
  }
}
