import { PrismaService } from '../../common/prisma/prisma.service';
export declare class AnalyticsService {
    private prisma;
    private readonly logger;
    constructor(prisma: PrismaService);
    getFoundationDashboardStats(tenantId: string): Promise<{
        kpi: {
            totalSantri: number;
            koperasiIncomeThisMonth: number;
            totalIzinThisMonth: number;
            izinPending: number;
        };
        chartData: {
            date: string;
            Koperasi: number;
            TopUp: number;
        }[];
    }>;
}
