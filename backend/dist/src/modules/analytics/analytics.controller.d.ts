import { AnalyticsService } from './analytics.service';
export declare class AnalyticsController {
    private readonly analyticsService;
    constructor(analyticsService: AnalyticsService);
    getFoundationStats(tenantId: string): Promise<{
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
