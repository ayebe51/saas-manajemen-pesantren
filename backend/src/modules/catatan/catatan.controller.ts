import { Controller, Get, Post, Body, Query, UseGuards, UseInterceptors, Req } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { CatatanService } from './catatan.service';
import { CreateCatatanDto, CreatePengumumanDto } from './dto/catatan.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { TenantId } from '../../common/decorators/tenant-id.decorator';
import { AuditLogInterceptor } from '../../common/interceptors/audit-log.interceptor';

@ApiTags('Buku Penghubung')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller()
export class CatatanController {
  constructor(private readonly catatanService: CatatanService) {}

  // --- CATATAN HARIAN ---

  @Post('catatan')
  @Roles('SUPERADMIN', 'TENANT_ADMIN', 'PENGURUS', 'MUSYRIF', 'GURU')
  @UseInterceptors(AuditLogInterceptor)
  @ApiOperation({ summary: 'Create a new daily note for a student' })
  createCatatan(
    @Body() createCatatanDto: CreateCatatanDto,
    @TenantId() tenantId: string,
    @Req() req: any
  ) {
    return this.catatanService.createCatatan(tenantId, createCatatanDto, req.user.id);
  }

  @Get('catatan')
  @ApiOperation({ summary: 'Get daily notes' })
  @ApiQuery({ name: 'santriId', required: false })
  findAllCatatan(
    @TenantId() tenantId: string,
    @Query('santriId') santriId?: string,
  ) {
    return this.catatanService.findAllCatatan(tenantId, santriId);
  }


  // --- PENGUMUMAN ---

  @Post('pengumuman')
  @Roles('SUPERADMIN', 'TENANT_ADMIN', 'PENGURUS')
  @UseInterceptors(AuditLogInterceptor)
  @ApiOperation({ summary: 'Create an announcement' })
  createPengumuman(
    @Body() createPengumumanDto: CreatePengumumanDto,
    @TenantId() tenantId: string,
  ) {
    return this.catatanService.createPengumuman(tenantId, createPengumumanDto);
  }

  @Get('pengumuman')
  @ApiOperation({ summary: 'Get announcements' })
  @ApiQuery({ name: 'audience', required: false })
  findAllPengumuman(
    @TenantId() tenantId: string,
    @Query('audience') audience?: string,
  ) {
    return this.catatanService.findAllPengumuman(tenantId, audience);
  }
}
