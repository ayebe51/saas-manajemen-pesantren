import {
  Controller,
  Get,
  Post,
  Param,
  Res,
  UseGuards,
} from '@nestjs/common';
import { Response } from 'express';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiParam,
  ApiResponse,
} from '@nestjs/swagger';
import { EidService } from './eid.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { TenantId } from '../../common/decorators/tenant-id.decorator';

@ApiTags('E-ID Card')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('eid')
export class EidController {
  constructor(private readonly eidService: EidService) {}

  /**
   * GET /eid/:santriId
   * Download E-ID Card PDF untuk santri tertentu.
   * Requirements: 17.1, 17.2
   */
  @Get(':santriId')
  @Roles(
    'SUPERADMIN',
    'TENANT_ADMIN',
    'PENGURUS',
    'Super_Admin',
    'Admin_Pesantren',
    'Wali_Kelas',
    'Wali_Santri',
    'Santri',
  )
  @ApiOperation({ summary: 'Download E-ID Card PDF santri' })
  @ApiParam({ name: 'santriId', description: 'ID santri' })
  @ApiResponse({ status: 200, description: 'PDF E-ID Card berhasil diunduh' })
  @ApiResponse({ status: 404, description: 'Santri tidak ditemukan' })
  async downloadEid(
    @Param('santriId') santriId: string,
    @TenantId() tenantId: string,
    @Res() res: Response,
  ) {
    const pdfBuffer = await this.eidService.generateEidPdf(santriId, tenantId);

    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="EID_${santriId}.pdf"`,
      'Content-Length': pdfBuffer.length,
    });
    res.send(pdfBuffer);
  }

  /**
   * POST /eid/:santriId/regenerate
   * Regenerasi E-ID Card dengan data santri terbaru.
   * Requirements: 17.4
   */
  @Post(':santriId/regenerate')
  @Roles(
    'SUPERADMIN',
    'TENANT_ADMIN',
    'PENGURUS',
    'Super_Admin',
    'Admin_Pesantren',
  )
  @ApiOperation({ summary: 'Regenerasi E-ID Card dengan data santri terbaru' })
  @ApiParam({ name: 'santriId', description: 'ID santri' })
  @ApiResponse({ status: 200, description: 'E-ID Card berhasil diregenerasi' })
  @ApiResponse({ status: 404, description: 'Santri tidak ditemukan' })
  async regenerateEid(
    @Param('santriId') santriId: string,
    @TenantId() tenantId: string,
    @Res() res: Response,
  ) {
    const pdfBuffer = await this.eidService.generateEidPdf(santriId, tenantId);

    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="EID_${santriId}_regenerated.pdf"`,
      'Content-Length': pdfBuffer.length,
    });
    res.send(pdfBuffer);
  }
}
