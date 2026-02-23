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
import { KesehatanService } from './kesehatan.service';
import { CreateHealthRecordDto, CreateMedicationDto } from './dto/kesehatan.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { TenantId } from '../../common/decorators/tenant-id.decorator';
import { AuditLogInterceptor } from '../../common/interceptors/audit-log.interceptor';

@ApiTags('Kesehatan')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('kesehatan')
export class KesehatanController {
  constructor(private readonly kesehatanService: KesehatanService) {}

  @Post('records')
  @Roles('SUPERADMIN', 'TENANT_ADMIN', 'KESEHATAN', 'PENGURUS')
  @UseInterceptors(AuditLogInterceptor)
  @ApiOperation({ summary: 'Create a new health record' })
  createRecord(@Body() dto: CreateHealthRecordDto, @TenantId() tenantId: string, @Req() req: any) {
    return this.kesehatanService.createRecord(tenantId, dto, req.user.id);
  }

  @Get('records')
  @ApiOperation({ summary: 'Get health records' })
  @ApiQuery({ name: 'santriId', required: false })
  findAllRecords(@TenantId() tenantId: string, @Query('santriId') santriId?: string) {
    return this.kesehatanService.findAllRecords(tenantId, santriId);
  }

  @Post('medications')
  @Roles('SUPERADMIN', 'TENANT_ADMIN', 'KESEHATAN', 'PENGURUS')
  @UseInterceptors(AuditLogInterceptor)
  @ApiOperation({ summary: 'Schedule a medication' })
  createMedication(@Body() dto: CreateMedicationDto, @TenantId() tenantId: string) {
    return this.kesehatanService.createMedication(tenantId, dto);
  }

  @Post('medications/:id/given')
  @Roles('SUPERADMIN', 'TENANT_ADMIN', 'KESEHATAN', 'PENGURUS')
  @UseInterceptors(AuditLogInterceptor)
  @ApiOperation({ summary: 'Mark medication as given' })
  markGiven(@Param('id') id: string, @TenantId() tenantId: string, @Req() req: any) {
    return this.kesehatanService.markMedicationGiven(id, tenantId, req.user.id);
  }
}
