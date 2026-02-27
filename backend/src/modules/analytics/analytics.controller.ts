import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { AnalyticsService } from './analytics.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { TenantId } from '../../common/decorators/tenant-id.decorator';

@ApiTags('Analytics')
@Controller('analytics')
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  @Get('foundation')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('SUPERADMIN', 'TENANT_ADMIN')
  @ApiOperation({ summary: 'Get KPI & Chart data for Yayasan / Management Dashboard' })
  getFoundationStats(@TenantId() tenantId: string) {
    return this.analyticsService.getFoundationDashboardStats(tenantId);
  }
}
