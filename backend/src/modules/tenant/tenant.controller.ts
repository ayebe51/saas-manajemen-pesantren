import { Controller, Get, Post, Body, Param, Put, UseGuards, Req } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { TenantService } from './tenant.service';
import { CreateTenantDto, UpdateTenantDto } from './dto/tenant.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { TenantId } from '../../common/decorators/tenant-id.decorator';

@ApiTags('Tenants')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('tenants')
export class TenantController {
  constructor(private readonly tenantService: TenantService) {}

  @Post()
  @Roles('SUPERADMIN')
  @ApiOperation({ summary: 'Create a new tenant (Superadmin only)' })
  @ApiResponse({ status: 201, description: 'Tenant successfully created' })
  create(@Body() createTenantDto: CreateTenantDto, @Req() req: any) {
    return this.tenantService.create(createTenantDto, req.user.id);
  }

  @Get()
  @Roles('SUPERADMIN')
  @ApiOperation({ summary: 'Get all tenants (Superadmin only)' })
  findAll() {
    return this.tenantService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get tenant details' })
  findOne(@Param('id') id: string, @TenantId() tenantId: string, @Req() req: any) {
    const queryId = req.user.role === 'SUPERADMIN' ? id : tenantId;
    return this.tenantService.findOne(queryId);
  }

  @Put(':id')
  @Roles('SUPERADMIN', 'TENANT_ADMIN')
  @ApiOperation({ summary: 'Update tenant settings' })
  update(
    @Param('id') id: string,
    @Body() updateTenantDto: UpdateTenantDto,
    @TenantId() tenantId: string,
    @Req() req: any
  ) {
    const updateId = req.user.role === 'SUPERADMIN' ? id : tenantId;
    return this.tenantService.update(updateId, updateTenantDto);
  }
}
