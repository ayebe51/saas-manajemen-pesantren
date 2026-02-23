import { PrismaService } from '../../common/prisma/prisma.service';
export declare class DashboardService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    getSummary(tenantId: string): Promise<{
        totalSantri: number;
        santriAktif: number;
        izinActive: number;
        pelanggaranWeek: number;
        outstandingInvoices: number;
        kunjunganToday: number;
    }>;
    getTrends(tenantId: string, metric: string, range: string): Promise<{
        date: string;
        count: number;
    }[] | {
        date: string;
        totalAmount: number;
    }[]>;
    private aggregateByDay;
    private aggregateAmountByDay;
}
