import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Put,
  Query,
  UseGuards,
  UseInterceptors,
  Req,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { PerizinanService } from './perizinan.service';
import { CreateIzinDto, ApproveIzinDto } from './dto/izin.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { TenantId } from '../../common/decorators/tenant-id.decorator';
import { Public } from '../../common/decorators/public.decorator';
import { AuditLogInterceptor } from '../../common/interceptors/audit-log.interceptor';

@ApiTags('Perizinan')
@Controller('izin')
export class PerizinanController {
  constructor(private readonly perizinanService: PerizinanService) {}

  @Post()
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('SUPERADMIN', 'TENANT_ADMIN', 'PENGURUS', 'MUSYRIF')
  @UseInterceptors(AuditLogInterceptor)
  @ApiOperation({ summary: 'Submit a new leave permit (Izin)' })
  create(@Body() createIzinDto: CreateIzinDto, @TenantId() tenantId: string, @Req() req: any) {
    return this.perizinanService.create(tenantId, createIzinDto, req.user.id);
  }

  @Get()
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiOperation({ summary: 'Get all permits' })
  @ApiQuery({
    name: 'status',
    required: false,
    enum: ['PENDING', 'APPROVED', 'REJECTED', 'CHECKED_OUT', 'CHECKED_IN', 'EXPIRED'],
  })
  @ApiQuery({ name: 'santriId', required: false })
  findAll(
    @TenantId() tenantId: string,
    @Query('status') status?: string,
    @Query('santriId') santriId?: string,
  ) {
    return this.perizinanService.findAll(tenantId, { status, santriId });
  }

  @Get(':id')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Get permit details' })
  findOne(@Param('id') id: string, @TenantId() tenantId: string) {
    return this.perizinanService.findOne(id, tenantId);
  }

  @Post(':id/approve')
  @Public() // Public so Wali can approve via link from WA without login
  @ApiOperation({ summary: 'Approve or Reject permit (Wali)' })
  approve(@Param('id') id: string, @Body() approveIzinDto: ApproveIzinDto) {
    // In a real app, we'd verify the token provided in DTO
    return this.perizinanService.approve(id, approveIzinDto);
  }

  @Post(':id/checkout')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('SUPERADMIN', 'TENANT_ADMIN', 'PENGURUS')
  @UseInterceptors(AuditLogInterceptor)
  @ApiOperation({ summary: 'Record student leaving (Scan QR)' })
  checkout(@Param('id') id: string, @TenantId() tenantId: string, @Req() req: any) {
    return this.perizinanService.checkout(id, tenantId, req.user.id);
  }

  @Post(':id/checkin')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('SUPERADMIN', 'TENANT_ADMIN', 'PENGURUS')
  @UseInterceptors(AuditLogInterceptor)
  @ApiOperation({ summary: 'Record student returning (Scan QR)' })
  checkin(@Param('id') id: string, @TenantId() tenantId: string, @Req() req: any) {
    return this.perizinanService.checkin(id, tenantId, req.user.id);
  }
}
