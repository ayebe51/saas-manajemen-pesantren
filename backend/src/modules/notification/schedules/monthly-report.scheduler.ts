import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../../../common/prisma/prisma.service';
import { ReportGeneratorService } from '../report-generator.service';
import { WhatsappGatewayService } from '../whatsapp-gateway.service';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class MonthlyReportScheduler {
  private readonly logger = new Logger(MonthlyReportScheduler.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly reportGenerator: ReportGeneratorService,
    private readonly waGateway: WhatsappGatewayService,
  ) {}

  // Run at 23:55 PM on the 28th of every month (Contoh agar bisa dites, realnya EOM)
  @Cron('0 55 23 28 * *')
  async handleMonthlyExecutiveReport() {
    this.logger.log('Memulai job generate Laporan Eksekutif Bulanan...');
    const now = new Date();
    const month = now.getMonth() + 1; // 1-12
    const year = now.getFullYear();

    // 1. Cari Semua Tenant (Cabang Yayasan) yang Aktif
    const activeTenants = await this.prisma.tenant.findMany({
      where: { status: 'ACTIVE' },
      include: {
        users: {
          where: { role: 'SUPERADMIN' }, // Kirim ke pimpinan (Admin Pusat)
          select: { phone: true, name: true },
        },
      },
    });

    for (const tenant of activeTenants) {
      if (tenant.users.length === 0) continue;

      try {
        // 2. Buat PDF (Buffer) Laba Koperasi & Indisipliner
        const pdfBuffer = await this.reportGenerator.generateMonthlyReport(tenant.id, month, year);

        // 3. Simpan sementara di /temp
        const tempDir = path.join(__dirname, '..', '..', '..', '..', 'temp');
        if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir, { recursive: true });

        const fileName = `Report-${tenant.name.replace(/\s+/g, '')}-${month}-${year}.pdf`;
        const filePath = path.join(tempDir, fileName);
        fs.writeFileSync(filePath, pdfBuffer);

        // 4. Broadcast via WhatsApp ke tiap Pimpinan Yayasan tsb
        for (const admin of tenant.users) {
          if (!admin.phone) continue;

          const message = `Halo ${admin.name},\nBerikut adalah *Laporan Eksekutif Bulanan* Yayasan ${tenant.name} periode ${month}/${year}.\nLaporan merangkum Sirkulasi Dana Koperasi (POS) & Pelanggaran Santri.\n\nSistem ERP Manajemen Pesantren. (File: ${fileName})`;

          // Mock attachment since Fonnte free needs URL, for demo we just send text
          await this.waGateway.sendMessage(admin.phone, message);
          this.logger.log(
            `Notifikasi PDF Laporan terkirim ke Pimpinan ${admin.name} (${admin.phone})`,
          );
        }
      } catch (err: any) {
        this.logger.error(`Gagal membuat jadwal laporan untuk tenant ${tenant.id}: ${err.message}`);
      }
    }
  }
}
