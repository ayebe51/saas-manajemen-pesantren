import { Controller, Get, Query, UseGuards, UseInterceptors } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { DashboardService } from './dashboard.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { TenantId } from '../../common/decorators/tenant-id.decorator';
import { TenantCacheInterceptor } from '../../common/interceptors/tenant-cache.interceptor';
import { CacheTTL } from '@nestjs/cache-manager';

@ApiTags('Dashboard & Reports')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@UseInterceptors(TenantCacheInterceptor)
@Controller('dashboard')
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get('summary')
  @ApiOperation({ summary: 'Get high level dashboard summary metrics' })
  @CacheTTL(300) // 5 Menit
  getSummary(@TenantId() tenantId: string) {
    return this.dashboardService.getSummary(tenantId);
  }

  @Get('trends')
  @ApiOperation({ summary: 'Get data trends for charts' })
  @ApiQuery({ name: 'metric', required: true, enum: ['izin', 'pelanggaran', 'pembayaran'] })
  @ApiQuery({ name: 'range', required: false, enum: ['7d', '30d', '90d'] })
  @CacheTTL(600) // 10 Menit untuk laporan tren grafikal
  getTrends(
    @TenantId() tenantId: string,
    @Query('metric') metric: string,
    @Query('range') range?: string,
  ) {
    return this.dashboardService.getTrends(tenantId, metric, range || '30d');
  }
}
