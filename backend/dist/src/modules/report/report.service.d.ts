import { PrismaService } from '../../common/prisma/prisma.service';
export declare class ReportService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    generateExcelReport(tenantId: string, module: string): Promise<Buffer>;
    generatePdfReport(tenantId: string, title: string, contentData: any[]): Promise<Buffer>;
}
