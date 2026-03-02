import { PrismaService } from '../../common/prisma/prisma.service';
export declare class ReportGeneratorService {
    private readonly prisma;
    private readonly logger;
    constructor(prisma: PrismaService);
    generateMonthlyReport(tenantId: string, month: number, year: number): Promise<Buffer>;
}
