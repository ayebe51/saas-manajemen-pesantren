import { Controller, Get, Param, Res, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { Response } from 'express';
import { ReportService } from './report.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { TenantGuard } from '../../common/guards/tenant.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { TenantId } from '../../common/decorators/tenant-id.decorator';

@ApiTags('Laporan (Cetak PDF / Excel)')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, TenantGuard, RolesGuard)
@Controller('api/v1/reports')
export class ReportController {
  constructor(private readonly reportService: ReportService) {}

  @Get('excel/:module')
  @Roles('SUPERADMIN', 'TENANT_ADMIN', 'PENGURUS')
  @ApiOperation({ summary: 'Mengunduh Laporan dalam format Excel (.xlsx)' })
  async downloadExcel(
    @TenantId() tenantId: string,
    @Param('module') module: string,
    @Res() res: Response,
  ) {
    const buffer = await this.reportService.generateExcelReport(tenantId, module);

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename=Laporan-${module}-${Date.now()}.xlsx`);

    return res.end(buffer);
  }

  @Get('pdf/:module')
  @Roles('SUPERADMIN', 'TENANT_ADMIN', 'PENGURUS')
  @ApiOperation({ summary: 'Mencetak Laporan Langsung ke format PDF' })
  async downloadPdf(
    @TenantId() tenantId: string,
    @Param('module') module: string,
    @Res() res: Response,
  ) {
    // Dummy Data for Preview based on module parameter
    const dummyData = [
      { description: `Item 1 for ${module}`, value: '100' },
      { description: `Item 2 for ${module}`, value: '250' },
    ];

    const buffer = await this.reportService.generatePdfReport(
        tenantId, 
        `Cetak Laporan - ${module.toUpperCase()}`, 
        dummyData
    );

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=Laporan-${module}-${Date.now()}.pdf`);

    return res.end(buffer);
  }
}
