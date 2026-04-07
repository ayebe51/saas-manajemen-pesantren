import {
  Controller,
  Get,
  Post,
  Param,
  Body,
  Res,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiResponse } from '@nestjs/swagger';
import { Response } from 'express';
import * as fs from 'fs';
import * as path from 'path';
import { ReportService } from './report.service';
import { GenerateReportDto } from './dto/generate-report.dto';
import { ReportJobResponseDto } from './dto/report-job-response.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { TenantId } from '../../common/decorators/tenant-id.decorator';

interface JwtUser {
  id: string;
  email: string;
  role: string;
  tenantId?: string;
}

@ApiTags('Laporan')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('laporan')
export class ReportController {
  constructor(private readonly reportService: ReportService) {}

  /**
   * POST /laporan/generate
   * Enqueue async report generation job.
   * Requirements: 21.3, 21.4
   */
  @Post('generate')
  @HttpCode(HttpStatus.ACCEPTED)
  @ApiOperation({ summary: 'Enqueue generate laporan secara asinkron' })
  @ApiResponse({ status: 202, type: ReportJobResponseDto })
  async generateReport(
    @CurrentUser() user: JwtUser,
    @Body() dto: GenerateReportDto,
  ): Promise<{ data: ReportJobResponseDto }> {
    const job = await this.reportService.enqueueReport(user.id, dto);
    return { data: job };
  }

  /**
   * GET /laporan/jobs/:jobId
   * Cek status report job.
   * Requirements: 21.4
   */
  @Get('jobs/:jobId')
  @ApiOperation({ summary: 'Cek status report job' })
  @ApiResponse({ status: 200, type: ReportJobResponseDto })
  async getJobStatus(
    @CurrentUser() user: JwtUser,
    @Param('jobId') jobId: string,
  ): Promise<{ data: ReportJobResponseDto }> {
    const job = await this.reportService.getReportStatus(jobId, user.id);
    return { data: job };
  }

  /**
   * GET /laporan/jobs/:jobId/download
   * Download file laporan yang sudah selesai.
   * Requirements: 21.3, 21.4
   */
  @Get('jobs/:jobId/download')
  @ApiOperation({ summary: 'Download laporan yang sudah selesai digenerate' })
  async downloadReport(
    @CurrentUser() user: JwtUser,
    @Param('jobId') jobId: string,
    @Res() res: Response,
  ): Promise<void> {
    const filePath = await this.reportService.downloadReport(jobId, user.id);

    if (!fs.existsSync(filePath)) {
      res.status(HttpStatus.NOT_FOUND).json({ error: { code: 'FILE_NOT_FOUND', message: 'File laporan tidak ditemukan' } });
      return;
    }

    const ext = path.extname(filePath).toLowerCase();
    const contentType = ext === '.pdf'
      ? 'application/pdf'
      : 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';

    res.setHeader('Content-Type', contentType);
    res.setHeader('Content-Disposition', `attachment; filename=laporan-${jobId}${ext}`);
    res.sendFile(filePath);
  }

  // ─── Legacy endpoints (backward compat) ──────────────────────────────────

  @Get('excel/:module')
  @ApiOperation({ summary: 'Download laporan Excel (legacy)' })
  async downloadExcel(
    @TenantId() tenantId: string,
    @Param('module') module: string,
    @Res() res: Response,
  ): Promise<void> {
    const buffer = await this.reportService.generateExcelReport(tenantId, module);
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename=Laporan-${module}-${Date.now()}.xlsx`);
    res.end(buffer);
  }

  @Get('pdf/:module')
  @ApiOperation({ summary: 'Download laporan PDF (legacy)' })
  async downloadPdf(
    @TenantId() tenantId: string,
    @Param('module') module: string,
    @Res() res: Response,
  ): Promise<void> {
    const dummyData = [
      { description: `Item 1 for ${module}`, value: '100' },
      { description: `Item 2 for ${module}`, value: '250' },
    ];
    const buffer = await this.reportService.generatePdfReport(tenantId, `Cetak Laporan - ${module.toUpperCase()}`, dummyData);
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=Laporan-${module}-${Date.now()}.pdf`);
    res.end(buffer);
  }
}
