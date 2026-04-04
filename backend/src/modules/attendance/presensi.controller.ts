import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  UseGuards,
  Req,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';
import { Request } from 'express';
import { PresensiService } from './presensi.service';
import { CreateSessionDto } from './dto/create-session.dto';
import { ScanAttendanceDto } from './dto/scan-attendance.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { TenantId } from '../../common/decorators/tenant-id.decorator';

@ApiTags('Attendance (Presensi)')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('attendance')
export class PresensiController {
  constructor(private readonly presensiService: PresensiService) {}

  /**
   * POST /attendance/sessions
   * Buat sesi presensi baru
   * Requirements: 5.1
   */
  @Post('sessions')
  @Roles('SUPERADMIN', 'TENANT_ADMIN', 'PENGURUS', 'GURU', 'SCANNER')
  @ApiOperation({ summary: 'Buat sesi presensi baru' })
  async createSession(
    @TenantId() tenantId: string,
    @CurrentUser() user: any,
    @Body() dto: CreateSessionDto,
  ) {
    return this.presensiService.createSession(tenantId, user.id, dto);
  }

  /**
   * GET /attendance/sessions/:id/qr
   * Generate QR token untuk sesi
   * Requirements: 5.1, 5.2
   */
  @Get('sessions/:id/qr')
  @Roles('SUPERADMIN', 'TENANT_ADMIN', 'PENGURUS', 'GURU', 'SCANNER')
  @ApiOperation({ summary: 'Generate QR token untuk sesi presensi' })
  @ApiParam({ name: 'id', description: 'Session ID' })
  async getSessionQr(
    @TenantId() tenantId: string,
    @Param('id') sessionId: string,
  ) {
    return this.presensiService.getSessionQr(tenantId, sessionId);
  }

  /**
   * POST /attendance/scan
   * Scan QR + submit GPS untuk presensi
   * Requirements: 5.2, 5.3, 5.4, 5.5, 5.6, 5.7, 5.8, 5.11
   */
  @Post('scan')
  @HttpCode(HttpStatus.OK)
  @Roles('SUPERADMIN', 'TENANT_ADMIN', 'PENGURUS', 'GURU', 'SCANNER', 'SANTRI')
  @ApiOperation({ summary: 'Scan QR code untuk presensi (dengan validasi GPS)' })
  async scan(
    @CurrentUser() user: any,
    @Body() dto: ScanAttendanceDto,
    @Req() req: Request,
  ) {
    const ipAddress = (req.headers['x-forwarded-for'] as string) || req.ip;
    return this.presensiService.scan(dto, user.id, ipAddress);
  }

  /**
   * GET /attendance/sessions/:id/records
   * Rekap presensi untuk satu sesi
   * Requirements: 5.9
   */
  @Get('sessions/:id/records')
  @Roles('SUPERADMIN', 'TENANT_ADMIN', 'PENGURUS', 'GURU')
  @ApiOperation({ summary: 'Rekap presensi untuk satu sesi' })
  @ApiParam({ name: 'id', description: 'Session ID' })
  async getSessionRecords(
    @TenantId() tenantId: string,
    @Param('id') sessionId: string,
  ) {
    return this.presensiService.getSessionRecords(tenantId, sessionId);
  }

  /**
   * GET /attendance/santri/:id
   * Riwayat presensi santri
   * Requirements: 5.9
   */
  @Get('santri/:id')
  @Roles('SUPERADMIN', 'TENANT_ADMIN', 'PENGURUS', 'GURU', 'SANTRI')
  @ApiOperation({ summary: 'Riwayat presensi santri' })
  @ApiParam({ name: 'id', description: 'Santri ID' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  async getSantriAttendance(
    @TenantId() tenantId: string,
    @Param('id') santriId: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.presensiService.getSantriAttendance(
      tenantId,
      santriId,
      page ? Number(page) : 1,
      limit ? Number(limit) : 20,
    );
  }
}
