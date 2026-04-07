import { Injectable, NotFoundException, ForbiddenException, Logger } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import * as ExcelJS from 'exceljs';
import * as PdfPrinter from 'pdfmake';
import { TDocumentDefinitions } from 'pdfmake/interfaces';
import * as fs from 'fs';
import * as path from 'path';
import { PrismaService } from '../../common/prisma/prisma.service';
import { GenerateReportDto, TipeLaporan, FormatLaporan } from './dto/generate-report.dto';
import { ReportJobResponseDto } from './dto/report-job-response.dto';

export interface ReportFilter {
  startDate?: string;
  endDate?: string;
  kelasId?: string;
  asramaId?: string;
  format: FormatLaporan;
}

@Injectable()
export class ReportService {
  private readonly logger = new Logger(ReportService.name);
  private readonly uploadsDir = path.join(process.cwd(), 'uploads', 'reports');

  constructor(
    private readonly prisma: PrismaService,
    @InjectQueue('report') private readonly reportQueue: Queue,
  ) {
    // Pastikan direktori uploads/reports ada
    fs.mkdirSync(this.uploadsDir, { recursive: true });
  }

  // ─── Async Job Management ─────────────────────────────────────────────────

  /**
   * Buat ReportJob di DB dan enqueue ke BullMQ.
   * Requirements: 21.4
   */
  async enqueueReport(
    userId: string,
    dto: GenerateReportDto,
  ): Promise<ReportJobResponseDto> {
    const job = await this.prisma.reportJob.create({
      data: {
        userId,
        tipe: dto.tipe,
        status: 'PENDING',
        filter: {
          startDate: dto.startDate,
          endDate: dto.endDate,
          kelasId: dto.kelasId,
          asramaId: dto.asramaId,
          format: dto.format,
        },
      },
    });

    await this.reportQueue.add('generate-report', { jobId: job.id }, {
      attempts: 3,
      backoff: { type: 'exponential', delay: 5000 },
    });

    this.logger.log(`[ReportService] Enqueued report job ${job.id} (${dto.tipe})`);
    return job as ReportJobResponseDto;
  }

  /**
   * Ambil status ReportJob milik user.
   */
  async getReportStatus(jobId: string, userId: string): Promise<ReportJobResponseDto> {
    const job = await this.prisma.reportJob.findUnique({ where: { id: jobId } });
    if (!job) throw new NotFoundException('Report job tidak ditemukan');
    if (job.userId !== userId) throw new ForbiddenException('Akses ditolak');
    return job as ReportJobResponseDto;
  }

  /**
   * Kembalikan file path untuk download (hanya jika status DONE).
   */
  async downloadReport(jobId: string, userId: string): Promise<string> {
    const job = await this.getReportStatus(jobId, userId);
    if (job.status !== 'DONE' || !job.filePath) {
      throw new NotFoundException('Laporan belum siap atau tidak tersedia');
    }
    return job.filePath;
  }

  // ─── Report Generators ────────────────────────────────────────────────────

  async generateSantriReport(filter: ReportFilter, jobId: string): Promise<string> {
    const where: Record<string, unknown> = { deletedAt: null };
    if (filter.startDate || filter.endDate) {
      where.createdAt = this.buildDateRange(filter.startDate, filter.endDate);
    }
    if (filter.kelasId) where.kelasId = filter.kelasId;

    const data = await this.prisma.santri.findMany({
      where,
      select: {
        nis: true,
        namaLengkap: true,
        name: true,
        gender: true,
        kelas: true,
        status: true,
        tanggalMasuk: true,
        createdAt: true,
      },
      orderBy: { name: 'asc' },
    });

    const headers = ['No', 'NIS', 'Nama Lengkap', 'Jenis Kelamin', 'Kelas', 'Status', 'Tanggal Masuk'];
    const rows = data.map((s, i) => [
      i + 1,
      s.nis ?? '-',
      s.namaLengkap ?? s.name,
      s.gender,
      s.kelas ?? '-',
      s.status,
      s.tanggalMasuk ? this.formatDate(s.tanggalMasuk) : '-',
    ]);

    return this.saveReport(jobId, filter.format, 'Laporan Data Santri', headers, rows);
  }

  async generatePresensiReport(filter: ReportFilter, jobId: string): Promise<string> {
    const where: Record<string, unknown> = {};
    if (filter.startDate || filter.endDate) {
      where.date = this.buildDateRange(filter.startDate, filter.endDate);
    }

    const data = await this.prisma.attendance.findMany({
      where,
      include: { santri: { select: { name: true, nis: true } } },
      orderBy: { date: 'desc' },
    });

    const headers = ['No', 'NIS', 'Nama Santri', 'Tanggal', 'Status', 'Keterangan'];
    const rows = data.map((a, i) => [
      i + 1,
      a.santri.nis ?? '-',
      a.santri.name,
      this.formatDate(a.date),
      a.status,
      a.notes ?? '-',
    ]);

    return this.saveReport(jobId, filter.format, 'Laporan Presensi Santri', headers, rows);
  }

  async generateKeuanganReport(filter: ReportFilter, jobId: string): Promise<string> {
    const where: Record<string, unknown> = {};
    if (filter.startDate || filter.endDate) {
      where.createdAt = this.buildDateRange(filter.startDate, filter.endDate);
    }

    const invoices = await this.prisma.invoice.findMany({
      where,
      include: { santri: { select: { name: true, nis: true } } },
      orderBy: { createdAt: 'desc' },
    });

    const headers = ['No', 'No Invoice', 'Nama Santri', 'Tipe', 'Jumlah', 'Status', 'Tanggal'];
    const rows = invoices.map((inv, i) => [
      i + 1,
      inv.invoiceNumber,
      inv.santri.name,
      inv.tipe,
      Number(inv.jumlah).toLocaleString('id-ID'),
      inv.status,
      this.formatDate(inv.createdAt),
    ]);

    return this.saveReport(jobId, filter.format, 'Laporan Keuangan', headers, rows);
  }

  async generatePelanggaranReport(filter: ReportFilter, jobId: string): Promise<string> {
    const where: Record<string, unknown> = {};
    if (filter.startDate || filter.endDate) {
      where.createdAt = this.buildDateRange(filter.startDate, filter.endDate);
    }

    const data = await this.prisma.pelanggaran.findMany({
      where,
      include: { santri: { select: { name: true, nis: true } } },
      orderBy: { createdAt: 'desc' },
    });

    const headers = ['No', 'NIS', 'Nama Santri', 'Kategori', 'Tingkat', 'Poin', 'Keterangan', 'Tanggal'];
    const rows = data.map((p, i) => [
      i + 1,
      p.santri.nis ?? '-',
      p.santri.name,
      p.category,
      p.tingkatKeparahan ?? '-',
      p.poin,
      p.keterangan ?? p.description,
      this.formatDate(p.createdAt),
    ]);

    return this.saveReport(jobId, filter.format, 'Laporan Pelanggaran Santri', headers, rows);
  }

  async generateKesehatanReport(filter: ReportFilter, jobId: string): Promise<string> {
    const where: Record<string, unknown> = {};
    if (filter.startDate || filter.endDate) {
      where.createdAt = this.buildDateRange(filter.startDate, filter.endDate);
    }

    const data = await this.prisma.kunjunganKlinik.findMany({
      where,
      include: { santri: { select: { name: true, nis: true } } },
      orderBy: { createdAt: 'desc' },
    });

    const headers = ['No', 'NIS', 'Nama Santri', 'Keluhan', 'Diagnosis', 'Tindakan', 'Tanggal'];
    const rows = data.map((k, i) => [
      i + 1,
      k.santri.nis ?? '-',
      k.santri.name,
      k.keluhan,
      k.diagnosis ?? '-',
      k.tindakan ?? '-',
      this.formatDate(k.createdAt),
    ]);

    return this.saveReport(jobId, filter.format, 'Laporan Kesehatan Santri', headers, rows);
  }

  async generateKunjunganReport(filter: ReportFilter, jobId: string): Promise<string> {
    const where: Record<string, unknown> = {};
    if (filter.startDate || filter.endDate) {
      where.waktuMasuk = this.buildDateRange(filter.startDate, filter.endDate);
    }

    const data = await this.prisma.kunjunganTamu.findMany({
      where,
      include: { santri: { select: { name: true, nis: true } } },
      orderBy: { waktuMasuk: 'desc' },
    });

    const headers = ['No', 'Nama Santri', 'Nama Tamu', 'Hubungan', 'Waktu Masuk', 'Waktu Keluar'];
    const rows = data.map((k, i) => [
      i + 1,
      k.santri.name,
      k.namaTamu,
      k.hubungan,
      this.formatDate(k.waktuMasuk),
      k.waktuKeluar ? this.formatDate(k.waktuKeluar) : '-',
    ]);

    return this.saveReport(jobId, filter.format, 'Laporan Kunjungan Tamu', headers, rows);
  }

  async generateAsramaReport(filter: ReportFilter, jobId: string): Promise<string> {
    const asramaWhere: Record<string, unknown> = {};
    if (filter.asramaId) asramaWhere.id = filter.asramaId;

    const data = await this.prisma.asrama.findMany({
      where: asramaWhere,
      include: {
        kamar: {
          include: {
            penempatan: {
              where: { isAktif: true },
              include: { santri: { select: { name: true, nis: true } } },
            },
          },
        },
      },
    });

    const headers = ['No', 'Asrama', 'Kamar', 'Kapasitas', 'Terisi', 'Nama Santri', 'NIS'];
    const rows: (string | number)[][] = [];
    let no = 1;
    for (const asrama of data) {
      for (const kamar of asrama.kamar) {
        if (kamar.penempatan.length === 0) {
          rows.push([no++, asrama.nama, kamar.nama, kamar.kapasitas, 0, '-', '-']);
        } else {
          for (const p of kamar.penempatan) {
            rows.push([
              no++,
              asrama.nama,
              kamar.nama,
              kamar.kapasitas,
              kamar.penempatan.length,
              p.santri.name,
              p.santri.nis ?? '-',
            ]);
          }
        }
      }
    }

    return this.saveReport(jobId, filter.format, 'Laporan Hunian Asrama', headers, rows);
  }

  async generateKepegawaianReport(filter: ReportFilter, jobId: string): Promise<string> {
    const where: Record<string, unknown> = { deletedAt: null };
    if (filter.startDate || filter.endDate) {
      where.tanggalBergabung = this.buildDateRange(filter.startDate, filter.endDate);
    }

    const data = await this.prisma.pegawai.findMany({
      where,
      orderBy: { nama: 'asc' },
    });

    const headers = ['No', 'NIP', 'Nama', 'Jabatan', 'Tanggal Bergabung', 'Status'];
    const rows = data.map((p, i) => [
      i + 1,
      p.nip ?? '-',
      p.nama,
      p.jabatan,
      this.formatDate(p.tanggalBergabung),
      p.statusAktif ? 'Aktif' : 'Tidak Aktif',
    ]);

    return this.saveReport(jobId, filter.format, 'Laporan Data Kepegawaian', headers, rows);
  }

  async generateKoperasiReport(filter: ReportFilter, jobId: string): Promise<string> {
    const where: Record<string, unknown> = {};
    if (filter.startDate || filter.endDate) {
      where.serverTimestamp = this.buildDateRange(filter.startDate, filter.endDate);
    }

    const data = await this.prisma.koperasiTransaksi.findMany({
      where,
      include: {
        santri: { select: { name: true, nis: true } },
        item: { select: { nama: true } },
      },
      orderBy: { serverTimestamp: 'desc' },
    });

    const headers = ['No', 'NIS', 'Nama Santri', 'Item', 'Jumlah', 'Harga Satuan', 'Total', 'Tanggal'];
    const rows = data.map((t, i) => [
      i + 1,
      t.santri.nis ?? '-',
      t.santri.name,
      t.item.nama,
      t.jumlah,
      Number(t.hargaSatuan).toLocaleString('id-ID'),
      Number(t.total).toLocaleString('id-ID'),
      this.formatDate(t.serverTimestamp),
    ]);

    return this.saveReport(jobId, filter.format, 'Laporan Transaksi Koperasi', headers, rows);
  }

  // ─── Legacy methods (kept for backward compat) ───────────────────────────

  async generateExcelReport(tenantId: string, module: string): Promise<Buffer> {
    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'Sistem Manajemen Pesantren';
    workbook.created = new Date();
    const sheet = workbook.addWorksheet(`${module.toUpperCase()} Report`);

    if (module === 'santri') {
      sheet.columns = [
        { header: 'No', key: 'id', width: 5 },
        { header: 'NISN', key: 'nisn', width: 15 },
        { header: 'Nama Lengkap', key: 'name', width: 30 },
        { header: 'Gender', key: 'gender', width: 10 },
      ];
      const data = await this.prisma.santri.findMany({ where: { deletedAt: null } });
      data.forEach((row, index) => {
        sheet.addRow({ id: index + 1, nisn: row.nisn, name: row.name, gender: row.gender });
      });
    } else {
      sheet.addRow([`Report module '${module}' is under construction`]);
    }

    sheet.getRow(1).font = { bold: true };
    sheet.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE0E0E0' } };

    const buffer = await workbook.xlsx.writeBuffer();
    return buffer as unknown as Buffer;
  }

  async generatePdfReport(tenantId: string, title: string, contentData: { description: string; value: string }[]): Promise<Buffer> {
    return this.buildPdf(title, ['No', 'Deskripsi', 'Nilai'], contentData.map((item, i) => [i + 1, item.description, item.value]));
  }

  // ─── Private Helpers ──────────────────────────────────────────────────────

  private buildDateRange(startDate?: string, endDate?: string) {
    const range: Record<string, Date> = {};
    if (startDate) range.gte = new Date(startDate);
    if (endDate) range.lte = new Date(endDate);
    return range;
  }

  private formatDate(date: Date): string {
    return date.toLocaleDateString('id-ID', { day: '2-digit', month: '2-digit', year: 'numeric' });
  }

  private async saveReport(
    jobId: string,
    format: FormatLaporan,
    title: string,
    headers: string[],
    rows: (string | number)[][],
  ): Promise<string> {
    const ext = format === FormatLaporan.PDF ? 'pdf' : 'xlsx';
    const fileName = `${jobId}.${ext}`;
    const filePath = path.join(this.uploadsDir, fileName);

    if (format === FormatLaporan.PDF) {
      const buffer = await this.buildPdf(title, headers, rows);
      fs.writeFileSync(filePath, buffer);
    } else {
      await this.buildExcel(title, headers, rows, filePath);
    }

    return filePath;
  }

  private async buildPdf(title: string, headers: string[], rows: (string | number)[][]): Promise<Buffer> {
    const fonts = {
      Roboto: {
        normal: 'Helvetica',
        bold: 'Helvetica-Bold',
        italics: 'Helvetica-Oblique',
        bolditalics: 'Helvetica-BoldOblique',
      },
    };

    const printer = new (PdfPrinter as any)(fonts);

    const docDefinition: TDocumentDefinitions = {
      pageOrientation: 'landscape',
      content: [
        { text: title, style: 'header' },
        { text: `Digenerate pada: ${new Date().toLocaleDateString('id-ID')}`, margin: [0, 0, 0, 15] },
        {
          table: {
            headerRows: 1,
            widths: Array(headers.length).fill('*'),
            body: [
              headers.map(h => ({ text: h, bold: true, fillColor: '#EEEEEE' })),
              ...rows.map(row => row.map(cell => String(cell))),
            ],
          },
          layout: 'lightHorizontalLines',
        },
      ],
      styles: {
        header: { fontSize: 16, bold: true, margin: [0, 0, 0, 8] },
      },
      defaultStyle: { font: 'Roboto', fontSize: 9 },
    };

    const pdfDoc = printer.createPdfKitDocument(docDefinition);
    return new Promise((resolve, reject) => {
      const chunks: Buffer[] = [];
      pdfDoc.on('data', (chunk: Buffer) => chunks.push(chunk));
      pdfDoc.on('end', () => resolve(Buffer.concat(chunks)));
      pdfDoc.on('error', (err: Error) => reject(err));
      pdfDoc.end();
    });
  }

  private async buildExcel(
    title: string,
    headers: string[],
    rows: (string | number)[][],
    filePath: string,
  ): Promise<void> {
    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'Sistem Manajemen Pesantren';
    workbook.created = new Date();

    const sheet = workbook.addWorksheet(title.substring(0, 31));

    // Title row
    sheet.mergeCells(1, 1, 1, headers.length);
    const titleCell = sheet.getCell(1, 1);
    titleCell.value = title;
    titleCell.font = { bold: true, size: 14 };
    titleCell.alignment = { horizontal: 'center' };

    // Date row
    sheet.mergeCells(2, 1, 2, headers.length);
    sheet.getCell(2, 1).value = `Digenerate pada: ${new Date().toLocaleDateString('id-ID')}`;

    // Header row
    const headerRow = sheet.addRow(headers);
    headerRow.font = { bold: true };
    headerRow.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFD3D3D3' } };
    headerRow.eachCell(cell => {
      cell.border = {
        top: { style: 'thin' },
        left: { style: 'thin' },
        bottom: { style: 'thin' },
        right: { style: 'thin' },
      };
    });

    // Data rows
    for (const row of rows) {
      sheet.addRow(row);
    }

    // Auto-fit columns
    sheet.columns.forEach(col => {
      col.width = 18;
    });

    await workbook.xlsx.writeFile(filePath);
  }
}
