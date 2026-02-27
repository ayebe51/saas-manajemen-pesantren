import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';

@Injectable()
export class AnalyticsService {
  private readonly logger = new Logger(AnalyticsService.name);

  constructor(private prisma: PrismaService) {}

  async getFoundationDashboardStats(tenantId: string) {
    const today = new Date();
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);

    // 1. Total Santri Aktif
    const totalSantri = await this.prisma.santri.count({
      where: { tenantId, status: 'AKTIF' },
    });

    // 2. Laba / Omzet Koperasi (Total dari WalletTransaction type PAYMENT / POS)
    const cooperativeIncome = await this.prisma.walletTransaction.aggregate({
      where: {
        wallet: { tenantId },
        type: 'PAYMENT',
        method: 'POS/CASHLESS',
        status: 'SUCCESS',
        createdAt: { gte: startOfMonth },
      },
      _sum: { amount: true },
    });

    // 3. Statistik Perizinan Bulan Ini (Rasio Kepulangan/Sakit)
    const totalIzin = await this.prisma.izin.count({
      where: { tenantId, createdAt: { gte: startOfMonth } },
    });

    const izinTertunda = await this.prisma.izin.count({
      where: {
        tenantId,
        status: { in: ['PENDING_POSKESTREN', 'PENDING_MUSYRIF'] },
        createdAt: { gte: startOfMonth },
      },
    });

    // 4. Trend Pendapatan 7 Hari Terakhir (Wallet Topup + Koperasi)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(today.getDate() - 7);

    const recentTransactions = await this.prisma.walletTransaction.findMany({
      where: {
        wallet: { tenantId },
        status: 'SUCCESS',
        createdAt: { gte: sevenDaysAgo },
      },
      select: { amount: true, type: true, createdAt: true },
    });

    // Mengelompokkan transaksi per hari
    const incomeTrend = [];
    for (let i = 0; i < 7; i++) {
      const dateObj = new Date();
      dateObj.setDate(today.getDate() - i);
      const dateStr = dateObj.toISOString().split('T')[0];

      const dailyTransactions = recentTransactions.filter(
        (t) => t.createdAt.toISOString().split('T')[0] === dateStr,
      );
      const posIncome = dailyTransactions
        .filter((t) => t.type === 'PAYMENT')
        .reduce((sum, t) => sum + t.amount, 0);
      const topupIncome = dailyTransactions
        .filter((t) => t.type === 'DEPOSIT')
        .reduce((sum, t) => sum + t.amount, 0);

      incomeTrend.push({ date: dateStr, Koperasi: posIncome, TopUp: topupIncome });
    }

    return {
      kpi: {
        totalSantri,
        koperasiIncomeThisMonth: cooperativeIncome._sum.amount || 0,
        totalIzinThisMonth: totalIzin,
        izinPending: izinTertunda,
      },
      chartData: incomeTrend.reverse(), // Jadikan kronologis (terlama ke terbaru)
    };
  }
}
