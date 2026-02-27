import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { Roles } from '../../common/decorators/roles.decorator';
import { TenantId } from '../../common/decorators/tenant-id.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { TenantGuard } from '../../common/guards/tenant.guard';
import { AuditLogService } from './audit-log.service';

@ApiTags('Audit Logs')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, TenantGuard, RolesGuard)
@Controller('audit-log')
export class AuditLogController {
  constructor(private readonly auditLogService: AuditLogService) {}

  @Get()
  @Roles('SUPERADMIN', 'TENANT_ADMIN')
  @ApiOperation({ summary: 'Melihat riwayat jejak aktivitas user (Audit Trail)' })
  @ApiQuery({ name: 'action', required: false, description: 'e.g CREATE, UPDATE, DELETE' })
  @ApiQuery({ name: 'entity', required: false, description: 'e.g SANTRI, WALLET, INVOICE' })
  @ApiQuery({ name: 'userId', required: false })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  async findAll(
    @TenantId() tenantId: string,
    @Query('action') action?: string,
    @Query('entity') entity?: string,
    @Query('userId') userId?: string,
    @Query('limit') limit?: number,
  ) {
    const take = limit ? Number(limit) : 50;
    return this.auditLogService.findAll(tenantId, take, action, entity, userId);
  }

  @Get(':id')
  @Roles('SUPERADMIN', 'TENANT_ADMIN')
  @ApiOperation({ summary: 'Melihat detail spesifik payload data dari satu baris audit log' })
  async findOne(@TenantId() tenantId: string, @Param('id') id: string) {
    return this.auditLogService.findOne(tenantId, id);
  }
}
