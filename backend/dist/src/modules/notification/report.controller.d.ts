import { Response } from 'express';
import { ReportGeneratorService } from './report-generator.service';
export declare class ReportController {
    private readonly reportService;
    constructor(reportService: ReportGeneratorService);
    downloadReport(tenantId: string, res: Response, queryMonth?: string, queryYear?: string): Promise<void>;
}
