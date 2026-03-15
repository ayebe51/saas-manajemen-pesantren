import { Controller, Get, Post, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { AttendanceService } from './attendance.service';
import { TenantId } from '../../common/decorators/tenant-id.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';

@ApiTags('Attendance')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('attendance')
export class AttendanceController {
  constructor(private readonly attendanceService: AttendanceService) {}

  @Get('today')
  @Roles('SUPERADMIN', 'TENANT_ADMIN', 'PENGURUS', 'GURU', 'SCANNER')
  @ApiOperation({ summary: "Get today's attendance records" })
  async findToday(@TenantId() tenantId: string) {
    return this.attendanceService.findToday(tenantId);
  }

  @Get('schedules/today')
  @Roles('SUPERADMIN', 'TENANT_ADMIN', 'PENGURUS', 'GURU', 'SCANNER')
  @ApiOperation({ summary: "Get today's academic schedules for MAPEL scanning" })
  async getTodaySchedules(@TenantId() tenantId: string) {
    return this.attendanceService.getTodaySchedules(tenantId);
  }

  @Post('scan')
  @Roles('SUPERADMIN', 'TENANT_ADMIN', 'PENGURUS', 'GURU', 'SCANNER')
  @ApiOperation({ summary: 'Record attendance via QR scan or manual input' })
  async scan(
    @TenantId() tenantId: string,
    @Body() body: { santriId: string; type?: string; mode?: string; scheduleId?: string },
  ) {
    return this.attendanceService.scan(
      tenantId,
      body.santriId,
      body.mode,
      body.type,
      body.scheduleId,
    );
  }
}
