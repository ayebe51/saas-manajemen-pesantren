import { Injectable, Inject } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import { PrismaService } from '../../common/prisma/prisma.service';
import {
  DashboardSummaryDto,
  NotifikasiTerbaruDto,
} from './dto/dashboard-summary.dto';

const CACHE_KEY_SUMMARY = 'dashboard:summary';
const CACHE_TTL_SECONDS = 60; // 60 detik — Requirement 21.2 (< 2 detik p95)

@Injectable()
export class DashboardService {
  constructor(
    private readonly prisma: PrismaService,
    @Inject(CACHE_MANAGER) private readonly cacheManager: Cache,
  ) {}

  /**
   * Mengembalikan ringkasan data operasional dashboard.
   * Data di-cache di Redis selama 60 detik untuk memenuhi target < 2 detik p95.
   * Requirements: 21.1, 21.2
   */
  async getDashboardSummary(): Promise<DashboardSummaryDto> {
    const cached = await this.cacheManager.get<DashboardSummaryDto>(CACHE_KEY_SUMMARY);
    if (cached) {
      return cached;
    }

    const summary = await this.aggregateSummary();
    await this.cacheManager.set(CACHE_KEY_SUMMARY, summary, CACHE_TTL_SECONDS * 1000);
    return summary;
  }

  /**
   * Invalidasi cache dashboard (dipanggil saat data berubah signifikan).
   */
  async invalidateCache(): Promise<void> {
    await this.cacheManager.del(CACHE_KEY_SUMMARY);
  }

  private async aggregateSummary(): Promise<DashboardSummaryDto> {
    const now = new Date();
    const startOfToday = new Date(now);
    startOfToday.setHours(0, 0, 0, 0);
    const endOfToday = new Date(startOfToday);
    endOfToday.setDate(endOfToday.getDate() + 1);

    const [
      santriAktif,
      presensiHariIni,
      tagihanJatuhTempo,
      notifikasiWa,
      notifikasiAudit,
    ] = await Promise.all([
      // 1. Jumlah santri aktif (status = 'AKTIF' dan belum soft-deleted)
      this.prisma.santri.count({
        where: {
          status: 'AKTIF',
          deletedAt: null,
        },
      }),

      // 2. Rekap presensi hari ini — grouped by status
      this.prisma.presensiRecord.groupBy({
        by: ['status'],
        where: {
          serverTimestamp: {
            gte: startOfToday,
            lt: endOfToday,
          },
        },
        _count: { id: true },
      }),

      // 3. Tagihan jatuh tempo (status PENDING dan dueDate <= sekarang)
      this.prisma.invoice.aggregate({
        where: {
          status: 'PENDING',
          dueDate: { lte: now },
        },
        _count: { id: true },
        _sum: { jumlah: true },
      }),

      // 4a. Notifikasi terbaru dari wa_queue (10 entri terakhir)
      this.prisma.waQueue.findMany({
        orderBy: { createdAt: 'desc' },
        take: 10,
        select: {
          id: true,
          tipeNotifikasi: true,
          status: true,
          createdAt: true,
        },
      }),

      // 4b. Audit log terbaru sebagai fallback / tambahan (5 entri terakhir)
      this.prisma.auditLog.findMany({
        orderBy: { serverTimestamp: 'desc' },
        take: 5,
        select: {
          id: true,
          action: true,
          entity: true,
          serverTimestamp: true,
        },
      }),
    ]);

    // Hitung rekap presensi hari ini
    const presensiMap: Record<string, number> = { HADIR: 0, PENDING_REVIEW: 0, DITOLAK: 0 };
    for (const row of presensiHariIni) {
      if (row.status in presensiMap) {
        presensiMap[row.status] = row._count.id;
      }
    }
    const totalPresensi = presensiMap.HADIR + presensiMap.PENDING_REVIEW + presensiMap.DITOLAK;

    // Gabungkan notifikasi dari wa_queue dan audit_log
    const notifikasiWaFormatted: NotifikasiTerbaruDto[] = notifikasiWa.map((n) => ({
      id: n.id,
      tipe: `WA:${n.tipeNotifikasi}`,
      keterangan: `Status: ${n.status}`,
      createdAt: n.createdAt,
    }));

    const notifikasiAuditFormatted: NotifikasiTerbaruDto[] = notifikasiAudit.map((a) => ({
      id: a.id,
      tipe: `AUDIT:${a.entity}`,
      keterangan: a.action,
      createdAt: a.serverTimestamp,
    }));

    // Gabung, urutkan descending, ambil 10 terbaru
    const notifikasiTerbaru = [...notifikasiWaFormatted, ...notifikasiAuditFormatted]
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      .slice(0, 10);

    return {
      santriAktif,
      presensiHariIni: {
        hadir: presensiMap.HADIR,
        pendingReview: presensiMap.PENDING_REVIEW,
        ditolak: presensiMap.DITOLAK,
        total: totalPresensi,
      },
      tagihanJatuhTempo: {
        count: tagihanJatuhTempo._count.id,
        totalJumlah: Number(tagihanJatuhTempo._sum.jumlah ?? 0),
      },
      notifikasiTerbaru,
      cachedAt: new Date().toISOString(),
    };
  }

  // ─── Legacy methods (kept for backward compatibility) ─────────────────────

  async getSummary(tenantId: string) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const [
      totalSantri,
      santriAktif,
      izinActive,
      pelanggaranWeek,
      outstandingInvoices,
      kunjunganToday,
    ] = await Promise.all([
      this.prisma.santri.count({ where: { tenantId } }),
      this.prisma.santri.count({ where: { tenantId, status: 'AKTIF' } }),
      this.prisma.izin.count({
        where: {
          tenantId,
          status: { in: ['APPROVED', 'CHECKED_OUT'] },
        },
      }),
      this.prisma.pelanggaran.count({
        where: {
          tenantId,
          date: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
        },
      }),
      this.prisma.invoice.count({
        where: {
          tenantId,
          status: { in: ['UNPAID', 'PARTIAL'] },
        },
      }),
      this.prisma.kunjungan.count({
        where: {
          tenantId,
          scheduledAt: { gte: today, lt: tomorrow },
          status: { not: 'CANCELLED' },
        },
      }),
    ]);

    return {
      totalSantri,
      santriAktif,
      izinActive,
      pelanggaranWeek,
      outstandingInvoices,
      kunjunganToday,
    };
  }

  async getTrends(tenantId: string, metric: string, range: string) {
    const days = range === '7d' ? 7 : range === '90d' ? 90 : 30;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    startDate.setHours(0, 0, 0, 0);

    if (metric === 'izin') {
      const data = await this.prisma.izin.findMany({
        where: { tenantId, createdAt: { gte: startDate } },
        select: { createdAt: true },
      });
      return this.aggregateByDay(data, 'createdAt', days);
    }

    if (metric === 'pelanggaran') {
      const data = await this.prisma.pelanggaran.findMany({
        where: { tenantId, date: { gte: startDate } },
        select: { date: true, severity: true },
      });
      return this.aggregateByDay(data, 'date', days);
    }

    if (metric === 'pembayaran') {
      const data = await this.prisma.payment.findMany({
        where: {
          invoice: { tenantId },
          createdAt: { gte: startDate },
          status: 'SUCCESS',
        },
        select: { createdAt: true, amount: true },
      });
      return this.aggregateAmountByDay(data, 'createdAt', days);
    }

    return [];
  }

  private aggregateByDay(data: any[], dateField: string, days: number) {
    const result: Record<string, number> = {};
    const now = new Date();
    now.setHours(0, 0, 0, 0);

    for (let i = 0; i < days; i++) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      result[d.toISOString().split('T')[0]] = 0;
    }

    data.forEach((item) => {
      const dateStr = new Date(item[dateField]).toISOString().split('T')[0];
      if (result[dateStr] !== undefined) {
        result[dateStr]++;
      }
    });

    return Object.keys(result)
      .sort()
      .map((date) => ({ date, count: result[date] }));
  }

  private aggregateAmountByDay(data: any[], dateField: string, days: number) {
    const result: Record<string, number> = {};
    const now = new Date();
    now.setHours(0, 0, 0, 0);

    for (let i = 0; i < days; i++) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      result[d.toISOString().split('T')[0]] = 0;
    }

    data.forEach((item) => {
      const dateStr = new Date(item[dateField]).toISOString().split('T')[0];
      if (result[dateStr] !== undefined) {
        result[dateStr] += item.amount;
      }
    });

    return Object.keys(result)
      .sort()
      .map((date) => ({ date, totalAmount: result[date] }));
  }
}
