import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  UseGuards,
  UseInterceptors,
  Req,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { KunjunganService } from './kunjungan.service';
import { CreateKunjunganDto } from './dto/kunjungan.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { TenantId } from '../../common/decorators/tenant-id.decorator';
import { AuditLogInterceptor } from '../../common/interceptors/audit-log.interceptor';

@ApiTags('Kunjungan Wali (Visits)')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('kunjungan')
export class KunjunganController {
  constructor(private readonly kunjunganService: KunjunganService) {}

  @Post()
  @Roles('SUPERADMIN', 'TENANT_ADMIN', 'PENGURUS') // Assuming Wali has an app, they would have a restricted role or a public endpoint with API key
  @UseInterceptors(AuditLogInterceptor)
  @ApiOperation({ summary: 'Book a new visit' })
  create(@Body() dto: CreateKunjunganDto, @TenantId() tenantId: string) {
    return this.kunjunganService.create(tenantId, dto);
  }

  @Get()
  @ApiOperation({ summary: 'List visits' })
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
  @ApiOperation({ summary: 'Check in a visitor (Scan QR)' })
  checkin(
    @Param('id') id: string,
    @TenantId() tenantId: string,
    @Body('visitorName') visitorName: string, // Simple record
  ) {
    return this.kunjunganService.checkin(id, tenantId, visitorName);
  }
}
