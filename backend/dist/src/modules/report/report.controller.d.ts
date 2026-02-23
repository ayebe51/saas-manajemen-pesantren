import { Response } from 'express';
import { ReportService } from './report.service';
export declare class ReportController {
    private readonly reportService;
    constructor(reportService: ReportService);
    downloadExcel(tenantId: string, module: string, res: Response): Promise<Response<any, Record<string, any>>>;
    downloadPdf(tenantId: string, module: string, res: Response): Promise<Response<any, Record<string, any>>>;
}
