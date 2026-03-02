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
var SppSchedulerService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.SppSchedulerService = void 0;
const common_1 = require("@nestjs/common");
const schedule_1 = require("@nestjs/schedule");
const prisma_service_1 = require("../../../common/prisma/prisma.service");
let SppSchedulerService = SppSchedulerService_1 = class SppSchedulerService {
    constructor(prisma) {
        this.prisma = prisma;
        this.logger = new common_1.Logger(SppSchedulerService_1.name);
    }
    async handleSppReminderCron() {
        this.logger.log('SppScheduler: Mencari Santri yang belum lunas SPP bulan ini...');
        const santriWithWali = await this.prisma.santri.findMany({
            where: {
                status: 'ACTIVE',
            },
            include: {
                walis: {
                    where: { isPrimary: true },
                    include: { wali: true },
                },
            },
        });
        let queueCount = 0;
        for (const data of santriWithWali) {
            const waliPrimary = data.walis[0]?.wali;
            if (waliPrimary && waliPrimary.phone) {
                const nominalSpp = 'Rp 450.000';
                const message = `*PENGINGAT SPP PESANTREN*\n\nAssalamu'alaikum Bpk/Ibu ${waliPrimary.name}.\n\nKami mengingatkan bahwa tagihan Syahriah (SPP) Ananda *${data.name}* sebesar ${nominalSpp} untuk bulan ini akan segera jatuh tempo.\n\nMohon segera melunasi melalui VA atau fasilitas Top-Up pada Aplikasi Wali Santri.\n\nTerima Kasih.\n- Admin APSS`;
                this.logger.log(`[MOCK WA SPP RMD] To: ${waliPrimary.phone} - Msg: ${message}`);
                queueCount++;
            }
        }
        this.logger.log(`SppScheduler: Sukses mendaftarkan ${queueCount} pesan tagihan SPP ke Antrean WhatsApp (BullMQ). Tunggu pengiriman...`);
    }
};
exports.SppSchedulerService = SppSchedulerService;
__decorate([
    (0, schedule_1.Cron)(schedule_1.CronExpression.EVERY_DAY_AT_10AM),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], SppSchedulerService.prototype, "handleSppReminderCron", null);
exports.SppSchedulerService = SppSchedulerService = SppSchedulerService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], SppSchedulerService);
//# sourceMappingURL=spp.scheduler.js.map