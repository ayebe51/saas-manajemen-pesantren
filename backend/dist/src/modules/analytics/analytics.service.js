"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var AnalyticsService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.AnalyticsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../common/prisma/prisma.service");
let AnalyticsService = AnalyticsService_1 = class AnalyticsService {
    constructor(prisma) {
        this.prisma = prisma;
        this.logger = new common_1.Logger(AnalyticsService_1.name);
    }
    async getFoundationDashboardStats(tenantId) {
        const today = new Date();
        const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
        const totalSantri = await this.prisma.santri.count({
            where: { tenantId, status: 'AKTIF' },
        });
        const cooperativeIncome = await this.prisma.walletTransaction.aggregate({
            where: {
                wallet: { tenantId },
                type: 'PAYMENT',
                method: 'POS/CASHLESS',
                status: 'SUCCESS',
                createdAt: { gte: startOfMonth },
            },
            _sum: { amount: true },
        });
        const totalIzin = await this.prisma.izin.count({
            where: { tenantId, createdAt: { gte: startOfMonth } },
        });
        const izinTertunda = await this.prisma.izin.count({
            where: {
                tenantId,
                status: { in: ['PENDING_POSKESTREN', 'PENDING_MUSYRIF'] },
                createdAt: { gte: startOfMonth },
            },
        });
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(today.getDate() - 7);
        const recentTransactions = await this.prisma.walletTransaction.findMany({
            where: {
                wallet: { tenantId },
                status: 'SUCCESS',
                createdAt: { gte: sevenDaysAgo },
            },
            select: { amount: true, type: true, createdAt: true },
        });
        const incomeTrend = [];
        for (let i = 0; i < 7; i++) {
            const dateObj = new Date();
            dateObj.setDate(today.getDate() - i);
            const dateStr = dateObj.toISOString().split('T')[0];
            const dailyTransactions = recentTransactions.filter((t) => t.createdAt.toISOString().split('T')[0] === dateStr);
            const posIncome = dailyTransactions
                .filter((t) => t.type === 'PAYMENT')
                .reduce((sum, t) => sum + t.amount, 0);
            const topupIncome = dailyTransactions
                .filter((t) => t.type === 'DEPOSIT')
                .reduce((sum, t) => sum + t.amount, 0);
            incomeTrend.push({ date: dateStr, Koperasi: posIncome, TopUp: topupIncome });
        }
        return {
            kpi: {
                totalSantri,
                koperasiIncomeThisMonth: cooperativeIncome._sum.amount || 0,
                totalIzinThisMonth: totalIzin,
                izinPending: izinTertunda,
            },
            chartData: incomeTrend.reverse(),
        };
    }
};
exports.AnalyticsService = AnalyticsService;
exports.AnalyticsService = AnalyticsService = AnalyticsService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], AnalyticsService);
//# sourceMappingURL=analytics.service.js.map