import { Injectable, Logger } from '@nestjs/common';
import * as ejs from 'ejs';
import * as pdf from 'html-pdf-node';
import * as path from 'path';
import * as fs from 'fs';
import { PrismaService } from '../../common/prisma/prisma.service';

interface SantriDTO {
  id: string;
  name: string;
}

interface OffenderDTO {
  santriId: string;
  _count: { santriId: number };
}

@Injectable()
export class ReportGeneratorService {
  private readonly logger = new Logger(ReportGeneratorService.name);

  constructor(private readonly prisma: PrismaService) {}

  async generateMonthlyReport(tenantId: string, month: number, year: number): Promise<Buffer> {
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0, 23, 59, 59);

    // 1. Gather Data: Laba Koperasi (Total Terjual)
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

    // Menghitung akumulasi gross revenue
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

    const santriIds = topOffenders.map((o: OffenderDTO) => o.santriId);
    const santriData = await this.prisma.santri.findMany({ where: { id: { in: santriIds } } });

    const offendersList = topOffenders.map((off: OffenderDTO) => {
      const santri = santriData.find((s: SantriDTO) => s.id === off.santriId);
      return { name: santri?.name || 'Tidak Diketahui', count: off._count.santriId };
    });

    // 2. Prepare Template Data
    const templateData = {
      tenantName: 'SaaS Manajemen Pesantren', // Real app: fetch from tenant
      monthName: startDate.toLocaleString('id-ID', { month: 'long', year: 'numeric' }),
      income: income.toLocaleString('id-ID'),
      offenders: offendersList,
      generatedAt: new Date().toLocaleString('id-ID'),
    };

    // 3. Render HTML
    const templatePath = path.join(__dirname, 'templates', 'monthly-report.ejs');

    // Create templates directory if not exists
    if (!fs.existsSync(path.dirname(templatePath))) {
      fs.mkdirSync(path.dirname(templatePath), { recursive: true });
    }

    // Write Template File if not exists (for simplicity in this example)
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

    // 4. Generate PDF
    const options = { format: 'A4', margin: { top: '20px', bottom: '20px' } };
    const file = { content: htmlContent };

    try {
      const pdfBuffer = await pdf.generatePdf(file, options);
      this.logger.log(`PDF Report generated for ${month}/${year}`);
      return pdfBuffer as unknown as Buffer;
    } catch (error) {
      this.logger.error('Failed to generate PDF', error);
      throw error;
    }
  }
}
