import {
  Controller,
  Post,
  Get,
  Body,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiResponse } from '@nestjs/swagger';
import { LicenseService } from './license.service';
import { ActivateLicenseDto } from './dto/activate-license.dto';
import { LicenseStatusDto } from './dto/license-status.dto';
import { Roles } from '../../common/decorators/roles.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';

/**
 * License management endpoints — accessible by Super_Admin only.
 * Requirements: 19.7
 */
@ApiTags('License')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('SUPERADMIN', 'Super_Admin')
@Controller('license')
export class LicenseController {
  constructor(private readonly licenseService: LicenseService) {}

  /**
   * POST /license/activate
   * Activate the system with a license key (requires internet).
   * Requirements: 19.1, 19.2, 19.5
   */
  @Post('activate')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Activate license with a license key (online)' })
  @ApiResponse({ status: 200, type: LicenseStatusDto })
  async activate(@Body() dto: ActivateLicenseDto): Promise<LicenseStatusDto> {
    return this.licenseService.activateLicense(dto.licenseKey);
  }

  /**
   * GET /license/status
   * Get current license status.
   * Requirements: 19.7
   */
  @Get('status')
  @ApiOperation({ summary: 'Get current license status' })
  @ApiResponse({ status: 200, type: LicenseStatusDto })
  async getStatus(): Promise<LicenseStatusDto> {
    return this.licenseService.getLicenseStatus();
  }

  /**
   * POST /license/verify
   * Trigger manual online verification.
   * Requirements: 19.6
   */
  @Post('verify')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Trigger manual online license verification' })
  @ApiResponse({ status: 200, type: LicenseStatusDto })
  async verify(): Promise<LicenseStatusDto> {
    return this.licenseService.verifyLicense();
  }
}
