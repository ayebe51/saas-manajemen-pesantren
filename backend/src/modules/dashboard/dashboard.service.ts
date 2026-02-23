import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';

@Injectable()
export class DashboardService {
  constructor(private readonly prisma: PrismaService) {}

  async getSummary(tenantId: string) {
    const today = new Date();
    today.setHours(0,0,0,0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const [
      totalSantri, 
      santriAktif,
      izinActive, 
      pelanggaranWeek, 
      outstandingInvoices,
      kunjunganToday
    ] = await Promise.all([
      this.prisma.santri.count({ where: { tenantId } }),
      this.prisma.santri.count({ where: { tenantId, status: 'AKTIF' } }),
      
      // Izin currently active (approved and between start/end)
      this.prisma.izin.count({ 
        where: { 
          tenantId, 
          status: { in: ['APPROVED', 'CHECKED_OUT'] },
        } 
      }),
      
      // Pelanggaran this week
      this.prisma.pelanggaran.count({
        where: {
          tenantId,
          date: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) }
        }
      }),

      // Unpaid invoices
      this.prisma.invoice.count({
        where: {
          tenantId,
          status: { in: ['UNPAID', 'PARTIAL'] }
        }
      }),

      // Kunjungan scheduled today
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

  async getTrends(tenantId: string, metric: string, range: string) {
    const days = range === '7d' ? 7 : range === '90d' ? 90 : 30;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    startDate.setHours(0,0,0,0);

    // In a production app, we would use raw SQL GROUP BY date trunc for performance
    // For this boilerplate we fetch and group in memory to stay database agnostic

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
      // Sum amount per day
      return this.aggregateAmountByDay(data, 'createdAt', days);
    }

    return [];
  }

  private aggregateByDay(data: any[], dateField: string, days: number) {
    const result: Record<string, number> = {};
    const now = new Date();
    now.setHours(0,0,0,0);
    
    // Initialize empty days
    for(let i=0; i<days; i++) {
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

  private aggregateAmountByDay(data: any[], dateField: string, days: number) {
    const result: Record<string, number> = {};
    const now = new Date();
    now.setHours(0,0,0,0);
    
    for(let i=0; i<days; i++) {
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
}
