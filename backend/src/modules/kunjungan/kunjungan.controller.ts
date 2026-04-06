import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  Query,
  UseGuards,
  UseInterceptors,
  Request,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { KunjunganService } from './kunjungan.service';
import {
  CreateKunjunganDto,
  CreateKunjunganTamuDto,
  CheckoutKunjunganTamuDto,
  QueryKunjunganTamuDto,
} from './dto/kunjungan.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { TenantId } from '../../common/decorators/tenant-id.decorator';
import { AuditLogInterceptor } from '../../common/interceptors/audit-log.interceptor';

@ApiTags('Kunjungan')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('kunjungan')
export class KunjunganController {
  constructor(private readonly kunjunganService: KunjunganService) {}

  // ─── Visit Scheduling (existing) ─────────────────────────────────────────

  @Post()
  @Roles('SUPERADMIN', 'TENANT_ADMIN', 'PENGURUS')
  @UseInterceptors(AuditLogInterceptor)
  @ApiOperation({ summary: 'Book a new visit slot' })
  create(@Body() dto: CreateKunjunganDto, @TenantId() tenantId: string) {
    return this.kunjunganService.create(tenantId, dto);
  }

  @Get()
  @ApiOperation({ summary: 'List visit bookings' })
  @ApiQuery({ name: 'date', required: false, description: 'YYYY-MM-DD' })
  @ApiQuery({ name: 'santriId', required: false })
  findAll(
    @TenantId() tenantId: string,
    @Query('date') date?: string,
    @Query('santriId') santriId?: string,
  ) {
    return this.kunjunganService.findAll(tenantId, { date, santriId });
  }

  @Get('slots')
  @ApiOperation({ summary: 'Get available slots for a specific date' })
  @ApiQuery({ name: 'date', required: true, description: 'YYYY-MM-DD' })
  getSlots(@TenantId() tenantId: string, @Query('date') date: string) {
    return this.kunjunganService.getAvailableSlots(tenantId, date);
  }

  @Post(':id/checkin')
  @Roles('SUPERADMIN', 'TENANT_ADMIN', 'PENGURUS')
  @UseInterceptors(AuditLogInterceptor)
  @ApiOperation({ summary: 'Check in a visitor' })
  checkin(
    @Param('id') id: string,
    @TenantId() tenantId: string,
    @Body('visitorName') visitorName: string,
  ) {
    return this.kunjunganService.checkin(id, tenantId, visitorName);
  }

  // ─── KunjunganTamu (Guest Visit Recording) ────────────────────────────────
  // Requirements: 10.1, 10.2

  @Post('tamu')
  @Roles('SUPERADMIN', 'TENANT_ADMIN', 'PENGURUS')
  @UseInterceptors(AuditLogInterceptor)
  @ApiOperation({ summary: 'Catat kunjungan tamu baru — kirim notifikasi WA ke wali santri' })
  createKunjunganTamu(
    @Body() dto: CreateKunjunganTamuDto,
    @TenantId() tenantId: string,
    @Request() req: any,
  ) {
    return this.kunjunganService.createKunjunganTamu(tenantId, dto, req.user?.id);
  }

  @Get('tamu')
  @ApiOperation({ summary: 'Daftar kunjungan tamu dengan filter' })
  findAllKunjunganTamu(
    @TenantId() tenantId: string,
    @Query() query: QueryKunjunganTamuDto,
  ) {
    return this.kunjunganService.findAllKunjunganTamu(tenantId, query);
  }

  @Get('tamu/:id')
  @ApiOperation({ summary: 'Detail kunjungan tamu' })
  findOneKunjunganTamu(@Param('id') id: string, @TenantId() tenantId: string) {
    return this.kunjunganService.findOneKunjunganTamu(id, tenantId);
  }

  @Patch('tamu/:id/checkout')
  @Roles('SUPERADMIN', 'TENANT_ADMIN', 'PENGURUS')
  @UseInterceptors(AuditLogInterceptor)
  @ApiOperation({ summary: 'Catat waktu keluar tamu (checkout)' })
  checkoutKunjunganTamu(
    @Param('id') id: string,
    @TenantId() tenantId: string,
    @Body() dto: CheckoutKunjunganTamuDto,
    @Request() req: any,
  ) {
    return this.kunjunganService.checkoutKunjunganTamu(id, tenantId, dto, req.user?.id);
  }
}
