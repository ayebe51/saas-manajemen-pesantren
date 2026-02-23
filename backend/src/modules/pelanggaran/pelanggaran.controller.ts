import { Controller, Get, Post, Body, Param, Query, UseGuards, UseInterceptors, Req } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { PelanggaranService } from './pelanggaran.service';
import { CreatePelanggaranDto, CreatePembinaanDto } from './dto/pelanggaran.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { TenantId } from '../../common/decorators/tenant-id.decorator';
import { AuditLogInterceptor } from '../../common/interceptors/audit-log.interceptor';

@ApiTags('Pelanggaran & Pembinaan')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller()
export class PelanggaranController {
  constructor(private readonly pelanggaranService: PelanggaranService) {}

  @Post('pelanggaran')
  @Roles('SUPERADMIN', 'TENANT_ADMIN', 'PENGURUS', 'MUSYRIF', 'GURU')
  @UseInterceptors(AuditLogInterceptor)
  @ApiOperation({ summary: 'Record a new violation' })
  createPelanggaran(
    @Body() dto: CreatePelanggaranDto,
    @TenantId() tenantId: string,
    @Req() req: any
  ) {
    return this.pelanggaranService.createPelanggaran(tenantId, dto, req.user.id);
  }

  @Get('pelanggaran')
  @ApiOperation({ summary: 'List violations' })
  @ApiQuery({ name: 'santriId', required: false })
  findAllPelanggaran(
    @TenantId() tenantId: string,
    @Query('santriId') santriId?: string,
  ) {
    return this.pelanggaranService.findAllPelanggaran(tenantId, santriId);
  }

  @Post('pembinaan')
  @Roles('SUPERADMIN', 'TENANT_ADMIN', 'PENGURUS', 'MUSYRIF')
  @UseInterceptors(AuditLogInterceptor)
  @ApiOperation({ summary: 'Create a coaching/mentoring plan' })
  createPembinaan(
    @Body() dto: CreatePembinaanDto,
    @TenantId() tenantId: string,
  ) {
    return this.pelanggaranService.createPembinaan(tenantId, dto);
  }

  @Get('pembinaan')
  @ApiOperation({ summary: 'List coaching plans' })
  @ApiQuery({ name: 'santriId', required: false })
  findAllPembinaan(
    @TenantId() tenantId: string,
    @Query('santriId') santriId?: string,
  ) {
    return this.pelanggaranService.findAllPembinaan(tenantId, santriId);
  }
}
