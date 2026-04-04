import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Put,
  Query,
  Delete,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  Res,
  Req,
} from '@nestjs/common';
import { Response, Request } from 'express';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiConsumes,
  ApiBody,
} from '@nestjs/swagger';
import { SantriService } from './santri.service';
import {
  CreateSantriDto,
  UpdateSantriDto,
  CreateWaliDto,
  SantriFilterDto,
} from './dto/santri.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { TenantId } from '../../common/decorators/tenant-id.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { AuditLogInterceptor } from '../../common/interceptors/audit-log.interceptor';

@ApiTags('Santri')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@UseInterceptors(AuditLogInterceptor)
@Controller('santri')
export class SantriController {
  constructor(private readonly santriService: SantriService) {}

  // ─── Santri CRUD ─────────────────────────────────────────────────────────────

  /**
   * POST /santri
   * Req 3.1, 3.2 — Buat santri baru; validasi NIS unik
   */
  @Post()
  @Roles('SUPERADMIN', 'TENANT_ADMIN', 'PENGURUS', 'Super_Admin', 'Admin_Pesantren')
  @ApiOperation({ summary: 'Buat data santri baru' })
  async create(
    @TenantId() tenantId: string,
    @Body() dto: CreateSantriDto,
    @CurrentUser() user: any,
    @Req() req: Request,
  ) {
    return this.santriService.create(tenantId, dto, user?.id, req.ip);
  }

  /**
   * GET /santri
   * Req 3.6 — Pencarian berdasarkan nama, NIS, kelas, status
   */
  @Get()
  @ApiOperation({ summary: 'Daftar santri dengan filter dan paginasi' })
  findAll(@TenantId() tenantId: string, @Query() filters: SantriFilterDto) {
    return this.santriService.findAll(tenantId, filters);
  }

  /**
   * GET /santri/template
   * Download template Excel untuk bulk import
   */
  @Get('template')
  @Roles('SUPERADMIN', 'TENANT_ADMIN', 'PENGURUS', 'Super_Admin', 'Admin_Pesantren')
  @ApiOperation({ summary: 'Unduh template Excel untuk import data santri' })
  async downloadTemplate(@Res() res: Response) {
    const buffer = await this.santriService.generateTemplate();
    res.set({
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': 'attachment; filename="Template_Import_Santri.xlsx"',
    });
    res.send(buffer);
  }

  /**
   * POST /santri/import/bulk
   * Bulk import via Excel
   */
  @Post('import/bulk')
  @Roles('SUPERADMIN', 'TENANT_ADMIN', 'Super_Admin', 'Admin_Pesantren')
  @ApiOperation({ summary: 'Bulk import santri via file Excel' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: { file: { type: 'string', format: 'binary' } },
    },
  })
  @UseInterceptors(FileInterceptor('file'))
  async bulkImport(
    @UploadedFile() file: any,
    @TenantId() tenantId: string,
    @CurrentUser() user: any,
  ) {
    return this.santriService.bulkImport(tenantId, file, user?.id);
  }

  /**
   * GET /santri/:id
   * Req 3.1 — Detail santri beserta info wali
   */
  @Get(':id')
  @ApiOperation({ summary: 'Detail santri beserta data wali' })
  findOne(@Param('id') id: string, @TenantId() tenantId: string) {
    return this.santriService.findOne(id, tenantId);
  }

  /**
   * PUT /santri/:id
   * Req 3.5 — Update santri; catat ke audit log (nilai sebelum & sesudah)
   */
  @Put(':id')
  @Roles('SUPERADMIN', 'TENANT_ADMIN', 'PENGURUS', 'Super_Admin', 'Admin_Pesantren')
  @ApiOperation({ summary: 'Update data santri' })
  update(
    @Param('id') id: string,
    @Body() dto: UpdateSantriDto,
    @TenantId() tenantId: string,
    @CurrentUser() user: any,
    @Req() req: Request,
  ) {
    return this.santriService.update(id, tenantId, dto, user?.id, req.ip);
  }

  /**
   * DELETE /santri/:id
   * Req 3.3 — Soft delete; data historis tetap tersimpan
   */
  @Delete(':id')
  @Roles('SUPERADMIN', 'TENANT_ADMIN', 'Super_Admin', 'Admin_Pesantren')
  @ApiOperation({ summary: 'Soft delete santri (data historis tetap tersimpan)' })
  async remove(
    @Param('id') id: string,
    @TenantId() tenantId: string,
    @CurrentUser() user: any,
    @Req() req: Request,
  ) {
    return this.santriService.remove(id, tenantId, user?.id, req.ip);
  }

  /**
   * GET /santri/:id/history
   * Req 3.5 — Riwayat perubahan data santri dari audit log
   */
  @Get(':id/history')
  @Roles('SUPERADMIN', 'TENANT_ADMIN', 'PENGURUS', 'Super_Admin', 'Admin_Pesantren', 'Owner')
  @ApiOperation({ summary: 'Riwayat perubahan data santri (dari audit log)' })
  getHistory(@Param('id') id: string, @TenantId() tenantId: string) {
    return this.santriService.getHistory(id, tenantId);
  }

  // ─── Wali Management ─────────────────────────────────────────────────────────

  /**
   * POST /santri/:id/wali
   * Req 3.4 — Tambah wali baru dan hubungkan ke santri
   */
  @Post(':id/wali')
  @Roles('SUPERADMIN', 'TENANT_ADMIN', 'PENGURUS', 'Super_Admin', 'Admin_Pesantren')
  @ApiOperation({ summary: 'Tambah wali baru dan hubungkan ke santri' })
  addWali(
    @Param('id') santriId: string,
    @Body() dto: CreateWaliDto,
    @TenantId() tenantId: string,
    @CurrentUser() user: any,
    @Req() req: Request,
  ) {
    return this.santriService.addWali(santriId, tenantId, dto, user?.id, req.ip);
  }

  /**
   * POST /santri/:id/wali/:waliId/link
   * Hubungkan wali yang sudah ada ke santri ini
   */
  @Post(':id/wali/:waliId/link')
  @Roles('SUPERADMIN', 'TENANT_ADMIN', 'PENGURUS', 'Super_Admin', 'Admin_Pesantren')
  @ApiOperation({ summary: 'Hubungkan wali yang sudah ada ke santri ini' })
  linkExistingWali(
    @Param('id') santriId: string,
    @Param('waliId') waliId: string,
    @TenantId() tenantId: string,
  ) {
    return this.santriService.linkWali(santriId, waliId, tenantId);
  }
}
