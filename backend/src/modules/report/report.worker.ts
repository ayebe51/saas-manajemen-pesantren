import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { PrismaService } from '../../common/prisma/prisma.service';
import { ReportService, ReportFilter } from './report.service';
import { TipeLaporan, FormatLaporan } from './dto/generate-report.dto';

interface GenerateReportJobData {
  jobId: string;
}

/**
 * ReportWorker — BullMQ processor untuk generate laporan secara asinkron.
 * Requirements: 21.4
 */
@Processor('report')
export class ReportWorker extends WorkerHost {
  private readonly logger = new Logger(ReportWorker.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly reportService: ReportService,
  ) {
    super();
  }

  async process(job: Job<GenerateReportJobData>): Promise<void> {
    const { jobId } = job.data;
    this.logger.log(`[ReportWorker] Processing job ${jobId}`);

    // Update status ke PROCESSING
    await this.prisma.reportJob.update({
      where: { id: jobId },
      data: { status: 'PROCESSING' },
    });

    try {
      const reportJob = await this.prisma.reportJob.findUnique({ where: { id: jobId } });
      if (!reportJob) throw new Error(`ReportJob ${jobId} tidak ditemukan`);

      const filter = (reportJob.filter ?? {}) as unknown as ReportFilter;
      const format = (filter.format as FormatLaporan) ?? FormatLaporan.PDF;
      const tipe = reportJob.tipe as TipeLaporan;

      let filePath: string;

      switch (tipe) {
        case TipeLaporan.SANTRI:
          filePath = await this.reportService.generateSantriReport(filter, jobId);
          break;
        case TipeLaporan.PRESENSI:
          filePath = await this.reportService.generatePresensiReport(filter, jobId);
          break;
        case TipeLaporan.KEUANGAN:
          filePath = await this.reportService.generateKeuanganReport(filter, jobId);
          break;
        case TipeLaporan.PELANGGARAN:
          filePath = await this.reportService.generatePelanggaranReport(filter, jobId);
          break;
        case TipeLaporan.KESEHATAN:
          filePath = await this.reportService.generateKesehatanReport(filter, jobId);
          break;
        case TipeLaporan.KUNJUNGAN:
          filePath = await this.reportService.generateKunjunganReport(filter, jobId);
          break;
        case TipeLaporan.ASRAMA:
          filePath = await this.reportService.generateAsramaReport(filter, jobId);
          break;
        case TipeLaporan.KEPEGAWAIAN:
          filePath = await this.reportService.generateKepegawaianReport(filter, jobId);
          break;
        case TipeLaporan.KOPERASI:
          filePath = await this.reportService.generateKoperasiReport(filter, jobId);
          break;
        default:
          throw new Error(`Tipe laporan tidak dikenal: ${tipe}`);
      }

      // Update status ke DONE
      await this.prisma.reportJob.update({
        where: { id: jobId },
        data: { status: 'DONE', filePath },
      });

      // Kirim notifikasi in-app ke user
      await this.sendNotification(reportJob.userId, jobId, tipe);

      this.logger.log(`[ReportWorker] Job ${jobId} selesai. File: ${filePath}`);
    } catch (err: unknown) {
      const error = err as Error;
      this.logger.error(`[ReportWorker] Job ${jobId} gagal: ${error.message}`, error.stack);

      await this.prisma.reportJob.update({
        where: { id: jobId },
        data: { status: 'FAILED', errorMsg: error.message },
      });

      // Re-throw agar BullMQ bisa retry
      throw error;
    }
  }

  private async sendNotification(userId: string, jobId: string, tipe: string): Promise<void> {
    try {
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
        select: { tenantId: true },
      });

      if (!user?.tenantId) return;

      await this.prisma.notification.create({
        data: {
          tenantId: user.tenantId,
          userId,
          type: 'LAPORAN_SIAP',
          title: 'Laporan Siap Diunduh',
          body: `Laporan ${tipe} Anda telah selesai digenerate dan siap diunduh. Job ID: ${jobId}`,
          read: false,
        },
      });

      this.logger.log(`[ReportWorker] Notifikasi dikirim ke user ${userId}`);
    } catch (err: unknown) {
      const error = err as Error;
      this.logger.warn(`[ReportWorker] Gagal kirim notifikasi: ${error.message}`);
    }
  }
}
