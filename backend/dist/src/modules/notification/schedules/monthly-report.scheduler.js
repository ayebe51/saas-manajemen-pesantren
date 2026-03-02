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
var MonthlyReportScheduler_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.MonthlyReportScheduler = void 0;
const common_1 = require("@nestjs/common");
const schedule_1 = require("@nestjs/schedule");
const prisma_service_1 = require("../../../common/prisma/prisma.service");
const report_generator_service_1 = require("../report-generator.service");
const whatsapp_gateway_service_1 = require("../whatsapp-gateway.service");
const fs = require("fs");
const path = require("path");
let MonthlyReportScheduler = MonthlyReportScheduler_1 = class MonthlyReportScheduler {
    constructor(prisma, reportGenerator, waGateway) {
        this.prisma = prisma;
        this.reportGenerator = reportGenerator;
        this.waGateway = waGateway;
        this.logger = new common_1.Logger(MonthlyReportScheduler_1.name);
    }
    async handleMonthlyExecutiveReport() {
        this.logger.log('Memulai job generate Laporan Eksekutif Bulanan...');
        const now = new Date();
        const month = now.getMonth() + 1;
        const year = now.getFullYear();
        const activeTenants = await this.prisma.tenant.findMany({
            where: { status: 'ACTIVE' },
            include: {
                users: {
                    where: { role: 'SUPERADMIN' },
                    select: { phone: true, name: true },
                },
            },
        });
        for (const tenant of activeTenants) {
            if (tenant.users.length === 0)
                continue;
            try {
                const pdfBuffer = await this.reportGenerator.generateMonthlyReport(tenant.id, month, year);
                const tempDir = path.join(__dirname, '..', '..', '..', '..', 'temp');
                if (!fs.existsSync(tempDir))
                    fs.mkdirSync(tempDir, { recursive: true });
                const fileName = `Report-${tenant.name.replace(/\s+/g, '')}-${month}-${year}.pdf`;
                const filePath = path.join(tempDir, fileName);
                fs.writeFileSync(filePath, pdfBuffer);
                for (const admin of tenant.users) {
                    if (!admin.phone)
                        continue;
                    const message = `Halo ${admin.name},\nBerikut adalah *Laporan Eksekutif Bulanan* Yayasan ${tenant.name} periode ${month}/${year}.\nLaporan merangkum Sirkulasi Dana Koperasi (POS) & Pelanggaran Santri.\n\nSistem ERP Manajemen Pesantren. (File: ${fileName})`;
                    await this.waGateway.sendMessage(admin.phone, message);
                    this.logger.log(`Notifikasi PDF Laporan terkirim ke Pimpinan ${admin.name} (${admin.phone})`);
                }
            }
            catch (err) {
                this.logger.error(`Gagal membuat jadwal laporan untuk tenant ${tenant.id}: ${err.message}`);
            }
        }
    }
};
exports.MonthlyReportScheduler = MonthlyReportScheduler;
__decorate([
    (0, schedule_1.Cron)('0 55 23 28 * *'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], MonthlyReportScheduler.prototype, "handleMonthlyExecutiveReport", null);
exports.MonthlyReportScheduler = MonthlyReportScheduler = MonthlyReportScheduler_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        report_generator_service_1.ReportGeneratorService,
        whatsapp_gateway_service_1.WhatsappGatewayService])
], MonthlyReportScheduler);
//# sourceMappingURL=monthly-report.scheduler.js.map