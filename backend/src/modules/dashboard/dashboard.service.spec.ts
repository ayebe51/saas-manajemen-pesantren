/**
 * Unit tests for DashboardService
 * Requirements: 21.1, 21.2
 */
import { Test, TestingModule } from '@nestjs/testing';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { DashboardService } from './dashboard.service';
import { PrismaService } from '../../common/prisma/prisma.service';

// ─── Mock factories ───────────────────────────────────────────────────────────

function buildMockPrisma() {
  return {
    santri: {
      count: jest.fn().mockResolvedValue(0),
    },
    presensiRecord: {
      groupBy: jest.fn().mockResolvedValue([]),
    },
    invoice: {
      aggregate: jest.fn().mockResolvedValue({ _count: { id: 0 }, _sum: { jumlah: null } }),
      count: jest.fn().mockResolvedValue(0),
    },
    waQueue: {
      findMany: jest.fn().mockResolvedValue([]),
    },
    auditLog: {
      findMany: jest.fn().mockResolvedValue([]),
    },
    izin: {
      count: jest.fn().mockResolvedValue(0),
    },
    pelanggaran: {
      count: jest.fn().mockResolvedValue(0),
      findMany: jest.fn().mockResolvedValue([]),
    },
    kunjungan: {
      count: jest.fn().mockResolvedValue(0),
    },
    payment: {
      findMany: jest.fn().mockResolvedValue([]),
    },
  };
}

function buildMockCache() {
  const store = new Map<string, unknown>();
  return {
    get: jest.fn(async (key: string) => store.get(key) ?? null),
    set: jest.fn(async (key: string, value: unknown) => { store.set(key, value); }),
    del: jest.fn(async (key: string) => { store.delete(key); }),
  };
}

// ─── Test Suite ───────────────────────────────────────────────────────────────

describe('DashboardService', () => {
  let service: DashboardService;
  let mockPrisma: ReturnType<typeof buildMockPrisma>;
  let mockCache: ReturnType<typeof buildMockCache>;

  beforeEach(async () => {
    mockPrisma = buildMockPrisma();
    mockCache = buildMockCache();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DashboardService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: CACHE_MANAGER, useValue: mockCache },
      ],
    }).compile();

    service = module.get<DashboardService>(DashboardService);
    jest.clearAllMocks();
  });

  // ─── getDashboardSummary ──────────────────────────────────────────────────

  describe('getDashboardSummary() — Requirements 21.1, 21.2', () => {
    it('should return dashboard summary with all required fields', async () => {
      mockPrisma.santri.count.mockResolvedValue(150);
      mockPrisma.presensiRecord.groupBy.mockResolvedValue([
        { status: 'HADIR', _count: { id: 120 } },
        { status: 'PENDING_REVIEW', _count: { id: 5 } },
        { status: 'DITOLAK', _count: { id: 3 } },
      ]);
      mockPrisma.invoice.aggregate.mockResolvedValue({
        _count: { id: 10 },
        _sum: { jumlah: 5000000 },
      });
      mockPrisma.waQueue.findMany.mockResolvedValue([
        { id: 'wa-1', tipeNotifikasi: 'PRESENSI', status: 'SENT', createdAt: new Date() },
      ]);
      mockPrisma.auditLog.findMany.mockResolvedValue([
        { id: 'audit-1', action: 'LOGIN', entity: 'AUTH', serverTimestamp: new Date() },
      ]);

      const result = await service.getDashboardSummary();

      expect(result).toHaveProperty('santriAktif', 150);
      expect(result).toHaveProperty('presensiHariIni');
      expect(result.presensiHariIni.hadir).toBe(120);
      expect(result.presensiHariIni.pendingReview).toBe(5);
      expect(result.presensiHariIni.ditolak).toBe(3);
      expect(result.presensiHariIni.total).toBe(128);
      expect(result).toHaveProperty('tagihanJatuhTempo');
      expect(result.tagihanJatuhTempo.count).toBe(10);
      expect(result.tagihanJatuhTempo.totalJumlah).toBe(5000000);
      expect(result).toHaveProperty('notifikasiTerbaru');
      expect(Array.isArray(result.notifikasiTerbaru)).toBe(true);
      expect(result).toHaveProperty('cachedAt');
    });

    it('should use Redis cache on second call (cache hit)', async () => {
      mockPrisma.santri.count.mockResolvedValue(100);
      mockPrisma.presensiRecord.groupBy.mockResolvedValue([]);
      mockPrisma.invoice.aggregate.mockResolvedValue({ _count: { id: 0 }, _sum: { jumlah: null } });
      mockPrisma.waQueue.findMany.mockResolvedValue([]);
      mockPrisma.auditLog.findMany.mockResolvedValue([]);

      // First call — populates cache
      const first = await service.getDashboardSummary();
      expect(mockCache.set).toHaveBeenCalledTimes(1);

      // Second call — should hit cache
      const second = await service.getDashboardSummary();
      expect(mockCache.get).toHaveBeenCalledTimes(2);
      // Prisma should only be called once (first call)
      expect(mockPrisma.santri.count).toHaveBeenCalledTimes(1);
      expect(second.santriAktif).toBe(first.santriAktif);
    });

    it('should handle zero santri aktif gracefully', async () => {
      mockPrisma.santri.count.mockResolvedValue(0);
      mockPrisma.presensiRecord.groupBy.mockResolvedValue([]);
      mockPrisma.invoice.aggregate.mockResolvedValue({ _count: { id: 0 }, _sum: { jumlah: null } });
      mockPrisma.waQueue.findMany.mockResolvedValue([]);
      mockPrisma.auditLog.findMany.mockResolvedValue([]);

      const result = await service.getDashboardSummary();
      expect(result.santriAktif).toBe(0);
      expect(result.tagihanJatuhTempo.totalJumlah).toBe(0);
      expect(result.presensiHariIni.total).toBe(0);
    });

    it('should limit notifikasiTerbaru to 10 items', async () => {
      mockPrisma.santri.count.mockResolvedValue(50);
      mockPrisma.presensiRecord.groupBy.mockResolvedValue([]);
      mockPrisma.invoice.aggregate.mockResolvedValue({ _count: { id: 0 }, _sum: { jumlah: null } });

      // 10 WA notifications + 5 audit logs = 15 total, should be trimmed to 10
      mockPrisma.waQueue.findMany.mockResolvedValue(
        Array.from({ length: 10 }, (_, i) => ({
          id: `wa-${i}`,
          tipeNotifikasi: 'PRESENSI',
          status: 'SENT',
          createdAt: new Date(Date.now() - i * 1000),
        })),
      );
      mockPrisma.auditLog.findMany.mockResolvedValue(
        Array.from({ length: 5 }, (_, i) => ({
          id: `audit-${i}`,
          action: 'LOGIN',
          entity: 'AUTH',
          serverTimestamp: new Date(Date.now() - i * 2000),
        })),
      );

      const result = await service.getDashboardSummary();
      expect(result.notifikasiTerbaru.length).toBeLessThanOrEqual(10);
    });

    it('should query santri with status AKTIF and deletedAt null', async () => {
      mockPrisma.santri.count.mockResolvedValue(75);
      mockPrisma.presensiRecord.groupBy.mockResolvedValue([]);
      mockPrisma.invoice.aggregate.mockResolvedValue({ _count: { id: 0 }, _sum: { jumlah: null } });
      mockPrisma.waQueue.findMany.mockResolvedValue([]);
      mockPrisma.auditLog.findMany.mockResolvedValue([]);

      await service.getDashboardSummary();

      const countCall = mockPrisma.santri.count.mock.calls[0][0];
      expect(countCall.where.status).toBe('AKTIF');
      expect(countCall.where.deletedAt).toBeNull();
    });
  });

  // ─── invalidateCache ──────────────────────────────────────────────────────

  describe('invalidateCache()', () => {
    it('should delete the dashboard summary cache key', async () => {
      await service.invalidateCache();
      expect(mockCache.del).toHaveBeenCalledWith('dashboard:summary');
    });
  });

  // ─── getSummary (legacy) ──────────────────────────────────────────────────

  describe('getSummary() — legacy', () => {
    it('should return legacy summary with all expected fields', async () => {
      mockPrisma.santri.count
        .mockResolvedValueOnce(200) // totalSantri
        .mockResolvedValueOnce(180); // santriAktif
      mockPrisma.izin.count.mockResolvedValue(5);
      mockPrisma.pelanggaran.count.mockResolvedValue(3);
      mockPrisma.invoice.count.mockResolvedValue(12);
      mockPrisma.kunjungan.count.mockResolvedValue(2);

      const result = await service.getSummary('tenant-1');

      expect(result).toHaveProperty('totalSantri', 200);
      expect(result).toHaveProperty('santriAktif', 180);
      expect(result).toHaveProperty('izinActive', 5);
      expect(result).toHaveProperty('pelanggaranWeek', 3);
      expect(result).toHaveProperty('outstandingInvoices', 12);
      expect(result).toHaveProperty('kunjunganToday', 2);
    });
  });

  // ─── getTrends (legacy) ───────────────────────────────────────────────────

  describe('getTrends() — legacy', () => {
    it('should return trend data for izin metric', async () => {
      // Add izin.findMany to mock
      (mockPrisma as any).izin = { findMany: jest.fn().mockResolvedValue([]) };

      const result = await service.getTrends('tenant-1', 'izin', '7d');
      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBe(7);
      result.forEach((item: any) => {
        expect(item).toHaveProperty('date');
        expect(item).toHaveProperty('count');
      });
    });

    it('should return empty array for unknown metric', async () => {
      const result = await service.getTrends('tenant-1', 'unknown-metric', '30d');
      expect(result).toEqual([]);
    });
  });
});
