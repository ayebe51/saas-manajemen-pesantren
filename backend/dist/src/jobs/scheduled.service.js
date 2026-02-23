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
var ScheduledTasksService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.ScheduledTasksService = void 0;
const common_1 = require("@nestjs/common");
const schedule_1 = require("@nestjs/schedule");
const prisma_service_1 = require("../common/prisma/prisma.service");
let ScheduledTasksService = ScheduledTasksService_1 = class ScheduledTasksService {
    constructor(prisma) {
        this.prisma = prisma;
        this.logger = new common_1.Logger(ScheduledTasksService_1.name);
    }
    async handlePaymentReminders() {
        this.logger.log('Running daily payment reminders check...');
        const targetDate = new Date();
        targetDate.setDate(targetDate.getDate() + 3);
        targetDate.setHours(0, 0, 0, 0);
        const nextDay = new Date(targetDate);
        nextDay.setDate(nextDay.getDate() + 1);
        const dueSoon = await this.prisma.invoice.findMany({
            where: {
                status: { in: ['UNPAID', 'PARTIAL'] },
                dueDate: {
                    gte: targetDate,
                    lt: nextDay
                }
            },
            include: {
                santri: {
                    include: {
                        walis: { include: { wali: true } }
                    }
                },
                tenant: true
            }
        });
        this.logger.log(`Found ${dueSoon.length} invoices due in 3 days.`);
        for (const invoice of dueSoon) {
            if (invoice.santri.walis.length > 0) {
                this.logger.log(`[Queue Mock] Triggering Reminder WA to Wali ${invoice.santri.walis[0].wali.phone} for Invoice ${invoice.id} (Santri: ${invoice.santri.name})`);
            }
        }
    }
    async handleExpiredIzin() {
        this.logger.log('Running daily expired izin check...');
        const now = new Date();
        const expired = await this.prisma.izin.updateMany({
            where: {
                status: 'PENDING',
                startAt: { lt: now }
            },
            data: {
                status: 'EXPIRED'
            }
        });
        this.logger.log(`Marked ${expired.count} izin requests as expired.`);
    }
};
exports.ScheduledTasksService = ScheduledTasksService;
__decorate([
    (0, schedule_1.Cron)(schedule_1.CronExpression.EVERY_DAY_AT_8AM),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], ScheduledTasksService.prototype, "handlePaymentReminders", null);
__decorate([
    (0, schedule_1.Cron)(schedule_1.CronExpression.EVERY_DAY_AT_MIDNIGHT),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], ScheduledTasksService.prototype, "handleExpiredIzin", null);
exports.ScheduledTasksService = ScheduledTasksService = ScheduledTasksService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], ScheduledTasksService);
//# sourceMappingURL=scheduled.service.js.map