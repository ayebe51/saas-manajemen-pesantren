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
var ReportGeneratorService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.ReportGeneratorService = void 0;
const common_1 = require("@nestjs/common");
const ejs = require("ejs");
const pdf = require("html-pdf-node");
const path = require("path");
const fs = require("fs");
const prisma_service_1 = require("../../common/prisma/prisma.service");
let ReportGeneratorService = ReportGeneratorService_1 = class ReportGeneratorService {
    constructor(prisma) {
        this.prisma = prisma;
        this.logger = new common_1.Logger(ReportGeneratorService_1.name);
    }
    async generateMonthlyReport(tenantId, month, year) {
        const startDate = new Date(year, month - 1, 1);
        const endDate = new Date(year, month, 0, 23, 59, 59);
        const posTransactions = await this.prisma.inventoryTransaction.findMany({
            where: {
                tenantId,
                type: 'OUT',
                date: { gte: startDate, lte: endDate },
            },
            include: {
                item: {
                    select: { price: true },
                },
            },
        });
        let income = 0;
        for (const trx of posTransactions) {
            if (trx.item && trx.item.price) {
                income += trx.quantity * trx.item.price;
            }
        }
        const topOffenders = await this.prisma.pelanggaran.groupBy({
            by: ['santriId'],
            where: { tenantId, createdAt: { gte: startDate, lte: endDate } },
            _count: { santriId: true },
            orderBy: { _count: { santriId: 'desc' } },
            take: 5,
        });
        const santriIds = topOffenders.map((o) => o.santriId);
        const santriData = await this.prisma.santri.findMany({ where: { id: { in: santriIds } } });
        const offendersList = topOffenders.map((off) => {
            const santri = santriData.find((s) => s.id === off.santriId);
            return { name: santri?.name || 'Tidak Diketahui', count: off._count.santriId };
        });
        const templateData = {
            tenantName: 'SaaS Manajemen Pesantren',
            monthName: startDate.toLocaleString('id-ID', { month: 'long', year: 'numeric' }),
            income: income.toLocaleString('id-ID'),
            offenders: offendersList,
            generatedAt: new Date().toLocaleString('id-ID'),
        };
        const templatePath = path.join(__dirname, 'templates', 'monthly-report.ejs');
        if (!fs.existsSync(path.dirname(templatePath))) {
            fs.mkdirSync(path.dirname(templatePath), { recursive: true });
        }
        if (!fs.existsSync(templatePath)) {
            const htmlTemplate = `
      <!DOCTYPE html>
      <html>
      <head>
          <style>
              body { font-family: 'Helvetica', sans-serif; padding: 40px; color: #333; }
              .header { text-align: center; border-bottom: 2px solid #1a5f7a; padding-bottom: 20px; margin-bottom: 30px; }
              h1 { color: #1a5f7a; margin: 0; }
              .subtitle { color: #666; font-size: 14px; margin-top: 5px; }
              .section { margin-bottom: 30px; }
              .section-title { background: #f0f7fa; padding: 10px; border-left: 4px solid #1a5f7a; font-weight: bold; margin-bottom: 15px; }
              .metric { font-size: 24px; font-weight: bold; color: #2e8b57; }
              table { w-full; border-collapse: collapse; width: 100%; margin-top: 10px; }
              th, td { border: 1px solid #ddd; padding: 10px; text-align: left; }
              th { background-color: #f8f9fa; }
              .footer { text-align: center; margin-top: 50px; font-size: 12px; color: #999; }
          </style>
      </head>
      <body>
          <div class="header">
              <h1>MANAJEMEN PESANTREN</h1>
              <div class="subtitle">Laporan Eksekutif Bulanan - <%= tenantName %></div>
          </div>
          
          <div class="section">
              <div class="section-title">1. Ringkasan Finansial Koperasi (POS)</div>
              <p>Total Pendapatan Kotor Bulan <strong><%= monthName %></strong> sebesar:</p>
              <div class="metric">Rp <%= income %></div>
          </div>

          <div class="section">
              <div class="section-title">2. Top 5 Catatan Indisipliner Santri</div>
              <table>
                  <tr><th>Nama Santri</th><th>Jumlah Pelanggaran</th></tr>
                  <% if (offenders.length === 0) { %>
                    <tr><td colspan="2" style="text-align: center;">Tidak ada data pelanggaran bulan ini. Alhamdulillah.</td></tr>
                  <% } else { %>
                    <% offenders.forEach(function(santri) { %>
                      <tr><td><%= santri.name %></td><td><%= santri.count %> kali</td></tr>
                    <% }); %>
                  <% } %>
              </table>
          </div>

          <div class="footer">
              Dicetak otomatis oleh Sistem Engine ERP Pesantren pada <%= generatedAt %>
          </div>
      </body>
      </html>
      `;
            fs.writeFileSync(templatePath, htmlTemplate);
        }
        const htmlContent = await ejs.renderFile(templatePath, templateData);
        const options = { format: 'A4', margin: { top: '20px', bottom: '20px' } };
        const file = { content: htmlContent };
        try {
            const pdfBuffer = await pdf.generatePdf(file, options);
            this.logger.log(`PDF Report generated for ${month}/${year}`);
            return pdfBuffer;
        }
        catch (error) {
            this.logger.error('Failed to generate PDF', error);
            throw error;
        }
    }
};
exports.ReportGeneratorService = ReportGeneratorService;
exports.ReportGeneratorService = ReportGeneratorService = ReportGeneratorService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], ReportGeneratorService);
//# sourceMappingURL=report-generator.service.js.map