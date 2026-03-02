import { Controller, Get, Param, Res, Query } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { Response } from 'express';
import { ReportGeneratorService } from './report-generator.service';
import { Public } from '../../common/decorators/public.decorator';

@ApiTags('Report Sandbox (Demo)')
@Controller('report')
@Public()
export class ReportController {
  constructor(private readonly reportService: ReportGeneratorService) {}

  @Get('monthly/:tenantId')
  @ApiOperation({ summary: 'Simulate/Download PDF Report for current month' })
  async downloadReport(
    @Param('tenantId') tenantId: string,
    @Res() res: Response,
    @Query('month') queryMonth?: string,
    @Query('year') queryYear?: string,
  ) {
    const now = new Date();
    const month = queryMonth ? parseInt(queryMonth) : now.getMonth() + 1;
    const year = queryYear ? parseInt(queryYear) : now.getFullYear();

    const pdfBuffer = await this.reportService.generateMonthlyReport(tenantId, month, year);

    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename=Report-${month}-${year}.pdf`,
      'Content-Length': pdfBuffer.length,
    });

    res.end(pdfBuffer);
  }
}
