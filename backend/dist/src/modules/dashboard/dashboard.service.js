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
Object.defineProperty(exports, "__esModule", { value: true });
exports.DashboardService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../common/prisma/prisma.service");
let DashboardService = class DashboardService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async getSummary(tenantId) {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);
        const [totalSantri, santriAktif, izinActive, pelanggaranWeek, outstandingInvoices, kunjunganToday] = await Promise.all([
            this.prisma.santri.count({ where: { tenantId } }),
            this.prisma.santri.count({ where: { tenantId, status: 'AKTIF' } }),
            this.prisma.izin.count({
                where: {
                    tenantId,
                    status: { in: ['APPROVED', 'CHECKED_OUT'] },
                }
            }),
            this.prisma.pelanggaran.count({
                where: {
                    tenantId,
                    date: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) }
                }
            }),
            this.prisma.invoice.count({
                where: {
                    tenantId,
                    status: { in: ['UNPAID', 'PARTIAL'] }
                }
            }),
            this.prisma.kunjungan.count({
                where: {
                    tenantId,
                    scheduledAt: { gte: today, lt: tomorrow },
                    status: { not: 'CANCELLED' }
                }
            })
        ]);
        return {
            totalSantri,
            santriAktif,
            izinActive,
            pelanggaranWeek,
            outstandingInvoices,
            kunjunganToday
        };
    }
    async getTrends(tenantId, metric, range) {
        const days = range === '7d' ? 7 : range === '90d' ? 90 : 30;
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - days);
        startDate.setHours(0, 0, 0, 0);
        if (metric === 'izin') {
            const data = await this.prisma.izin.findMany({
                where: { tenantId, createdAt: { gte: startDate } },
                select: { createdAt: true }
            });
            return this.aggregateByDay(data, 'createdAt', days);
        }
        if (metric === 'pelanggaran') {
            const data = await this.prisma.pelanggaran.findMany({
                where: { tenantId, date: { gte: startDate } },
                select: { date: true, severity: true }
            });
            return this.aggregateByDay(data, 'date', days);
        }
        if (metric === 'pembayaran') {
            const data = await this.prisma.payment.findMany({
                where: {
                    invoice: { tenantId },
                    createdAt: { gte: startDate },
                    status: 'SUCCESS'
                },
                select: { createdAt: true, amount: true }
            });
            return this.aggregateAmountByDay(data, 'createdAt', days);
        }
        return [];
    }
    aggregateByDay(data, dateField, days) {
        const result = {};
        const now = new Date();
        now.setHours(0, 0, 0, 0);
        for (let i = 0; i < days; i++) {
            const d = new Date(now);
            d.setDate(d.getDate() - i);
            result[d.toISOString().split('T')[0]] = 0;
        }
        data.forEach(item => {
            const dateStr = new Date(item[dateField]).toISOString().split('T')[0];
            if (result[dateStr] !== undefined) {
                result[dateStr]++;
            }
        });
        return Object.keys(result).sort().map(date => ({
            date,
            count: result[date]
        }));
    }
    aggregateAmountByDay(data, dateField, days) {
        const result = {};
        const now = new Date();
        now.setHours(0, 0, 0, 0);
        for (let i = 0; i < days; i++) {
            const d = new Date(now);
            d.setDate(d.getDate() - i);
            result[d.toISOString().split('T')[0]] = 0;
        }
        data.forEach(item => {
            const dateStr = new Date(item[dateField]).toISOString().split('T')[0];
            if (result[dateStr] !== undefined) {
                result[dateStr] += item.amount;
            }
        });
        return Object.keys(result).sort().map(date => ({
            date,
            totalAmount: result[date]
        }));
    }
};
exports.DashboardService = DashboardService;
exports.DashboardService = DashboardService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], DashboardService);
//# sourceMappingURL=dashboard.service.js.map