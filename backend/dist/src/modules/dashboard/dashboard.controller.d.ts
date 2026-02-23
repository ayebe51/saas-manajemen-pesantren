import { DashboardService } from './dashboard.service';
export declare class DashboardController {
    private readonly dashboardService;
    constructor(dashboardService: DashboardService);
    getSummary(tenantId: string): Promise<{
        totalSantri: number;
        santriAktif: number;
        izinActive: number;
        pelanggaranWeek: number;
        outstandingInvoices: number;
        kunjunganToday: number;
    }>;
    getTrends(tenantId: string, metric: string, range?: string): Promise<{
        date: string;
        count: number;
    }[] | {
        date: string;
        totalAmount: number;
    }[]>;
}
