import { Controller, Get, Post, Body } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { AttendanceService } from './attendance.service';
import { TenantId } from '../../common/decorators/tenant-id.decorator';

@ApiTags('Attendance')
@Controller('attendance')
export class AttendanceController {
  constructor(private readonly attendanceService: AttendanceService) {}

  @Get('today')
  @ApiOperation({ summary: 'Get today\'s attendance records' })
  async findToday(@TenantId() tenantId: string) {
    return this.attendanceService.findToday(tenantId);
  }

  @Post('scan')
  @ApiOperation({ summary: 'Record attendance via QR scan or manual input' })
  async scan(
    @TenantId() tenantId: string,
    @Body() body: { santriId: string; type: string },
  ) {
    return this.attendanceService.scan(tenantId, body.santriId, body.type);
  }
}
