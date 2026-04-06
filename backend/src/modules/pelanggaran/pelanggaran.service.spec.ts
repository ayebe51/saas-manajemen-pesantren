import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { PelanggaranService } from './pelanggaran.service';
import { PrismaService } from '../../common/prisma/prisma.service';
import { WaQueueService } from '../wa-engine/wa-queue.service';
import { AuditLogService } from '../audit-log/audit-log.service';
import { TingkatKeparahanDto } from './dto/pelanggaran.dto';

// ─── Mocks ────────────────────────────────────────────────────────────────────

const mockPrismaService = {
  santri: { findFirst: jest.fn() },
  pelanggaran: {
    create: jest.fn(),
    findMany: jest.fn(),
    findFirst: jest.fn(),
    aggregate: jest.fn(),
  },
  rewardPoin: {
    create: jest.fn(),
    findMany: jest.fn(),
  },
  kategoriPelanggaran: {
    create: jest.fn(),
    findMany: jest.fn(),
  },
  pembinaan: {
    create: jest.fn(),
    findMany: jest.fn(),
  },
};

const mockWaQueueService = { enqueue: jest.fn() };
const mockAuditLogService = { log: jest.fn().mockResolvedValue(undefined) };

// ─── Helpers ──────────────────────────────────────────────────────────────────

const TENANT_ID = 'tenant-001';
const USER_ID = 'user-001';
const SANTRI_ID = 'santri-001';

function makeSantri(overrides: Partial<Record<string, unknown>> = {}) {
  return {
    id: SANTRI_ID,
    name: 'Ahmad',
    namaLengkap: 'Ahmad Fauzi',
    kelas: 'VII-A',
    tenantId: TENANT_ID,
    deletedAt: null,
    walis: [],
    ...overrides,
  };
}

function makePelanggaran(overrides: Partial<Record<string, unknown>> = {}) {
  return {
    id: 'pelanggaran-001',
    tenantId: TENANT_ID,
    santriId: SANTRI_ID,
    tingkatKeparahan: 'RINGAN',
    poin: 10,
    category: 'Terlambat',
    keterangan: 'Terlambat masuk kelas',
    serverTimestamp: new Date(),
    createdBy: USER_ID,
    santri: { name: 'Ahmad', namaLengkap: 'Ahmad Fauzi', kelas: 'VII-A' },
    kategori: null,
    ...overrides,
  };
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('PelanggaranService', () => {
  let service: PelanggaranService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PelanggaranService,
        { provide: PrismaService, useValue: mockPrismaService },
        { provide: WaQueueService, useValue: mockWaQueueService },
        { provide: AuditLogService, useValue: mockAuditLogService },
      ],
    }).compile();

    service = module.get<PelanggaranService>(PelanggaranService);
    jest.clearAllMocks();
  });

  // ─── createPelanggaran ─────────────────────────────────────────────────────

  describe('createPelanggaran', () => {
    const dto = {
      santriId: SANTRI_ID,
      tingkatKeparahan: TingkatKeparahanDto.RINGAN,
      poin: 10,
      category: 'Terlambat',
      keterangan: 'Terlambat masuk kelas',
    };

    it('should create pelanggaran and return with totalPoinAkumulasi', async () => {
      mockPrismaService.santri.findFirst.mockResolvedValue(makeSantri());
      mockPrismaService.pelanggaran.create.mockResolvedValue(makePelanggaran());
      mockPrismaService.pelanggaran.aggregate.mockResolvedValue({ _sum: { poin: 10 } });

      const result = await service.createPelanggaran(TENANT_ID, dto, USER_ID);

      expect(result.totalPoinAkumulasi).toBe(10);
      expect(mockPrismaService.pelanggaran.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            santriId: SANTRI_ID,
            tingkatKeparahan: 'RINGAN',
            poin: 10,
          }),
        }),
      );
    });

    it('should throw NotFoundException if santri not found', async () => {
      mockPrismaService.santri.findFirst.mockResolvedValue(null);

      await expect(service.createPelanggaran(TENANT_ID, dto, USER_ID)).rejects.toThrow(NotFoundException);
    });

    it('should log to audit log after creating pelanggaran', async () => {
      mockPrismaService.santri.findFirst.mockResolvedValue(makeSantri());
      mockPrismaService.pelanggaran.create.mockResolvedValue(makePelanggaran());
      mockPrismaService.pelanggaran.aggregate.mockResolvedValue({ _sum: { poin: 10 } });

      await service.createPelanggaran(TENANT_ID, dto, USER_ID);

      expect(mockAuditLogService.log).toHaveBeenCalledWith(
        expect.objectContaining({ aksi: 'CREATE_PELANGGARAN' }),
      );
    });

    it('should send WA notification when wali has phone number', async () => {
      const santriWithWali = makeSantri({
        walis: [
          {
            isPrimary: true,
            wali: { id: 'wali-001', namaLengkap: 'Bapak Ahmad', noHp: '08123456789' },
          },
        ],
      });
      mockPrismaService.santri.findFirst.mockResolvedValue(santriWithWali);
      mockPrismaService.pelanggaran.create.mockResolvedValue(makePelanggaran());
      mockPrismaService.pelanggaran.aggregate.mockResolvedValue({ _sum: { poin: 10 } });

      await service.createPelanggaran(TENANT_ID, dto, USER_ID);

      expect(mockWaQueueService.enqueue).toHaveBeenCalledWith(
        expect.objectContaining({ tipeNotifikasi: 'pelanggaran', noTujuan: '08123456789' }),
      );
    });

    it('should NOT send WA notification when wali has no phone', async () => {
      const santriNoPhone = makeSantri({
        walis: [{ isPrimary: true, wali: { id: 'wali-001', namaLengkap: 'Bapak Ahmad', noHp: null, phone: null } }],
      });
      mockPrismaService.santri.findFirst.mockResolvedValue(santriNoPhone);
      mockPrismaService.pelanggaran.create.mockResolvedValue(makePelanggaran());
      mockPrismaService.pelanggaran.aggregate.mockResolvedValue({ _sum: { poin: 10 } });

      await service.createPelanggaran(TENANT_ID, dto, USER_ID);

      expect(mockWaQueueService.enqueue).not.toHaveBeenCalled();
    });
  });

  // ─── hitungAkumulasiPoin ───────────────────────────────────────────────────

  describe('hitungAkumulasiPoin', () => {
    it('should return sum of unresolved poin', async () => {
      mockPrismaService.pelanggaran.aggregate.mockResolvedValue({ _sum: { poin: 45 } });

      const result = await service.hitungAkumulasiPoin(SANTRI_ID);
      expect(result).toBe(45);
    });

    it('should return 0 when no pelanggaran', async () => {
      mockPrismaService.pelanggaran.aggregate.mockResolvedValue({ _sum: { poin: null } });

      const result = await service.hitungAkumulasiPoin(SANTRI_ID);
      expect(result).toBe(0);
    });
  });

  // ─── Threshold accumulation ────────────────────────────────────────────────

  describe('Threshold — akumulasi poin', () => {
    const dto = {
      santriId: SANTRI_ID,
      tingkatKeparahan: TingkatKeparahanDto.BERAT,
      poin: 35,
      category: 'Kekerasan',
      keterangan: 'Berkelahi',
    };

    it('should log THRESHOLD_PERINGATAN when total poin >= 30', async () => {
      mockPrismaService.santri.findFirst.mockResolvedValue(makeSantri());
      mockPrismaService.pelanggaran.create.mockResolvedValue(makePelanggaran({ poin: 35 }));
      mockPrismaService.pelanggaran.aggregate.mockResolvedValue({ _sum: { poin: 35 } });

      await service.createPelanggaran(TENANT_ID, dto, USER_ID);

      // Audit log called at least once (for CREATE_PELANGGARAN)
      expect(mockAuditLogService.log).toHaveBeenCalled();
    });

    it('should log THRESHOLD_PEMBINAAN when total poin >= 60', async () => {
      mockPrismaService.santri.findFirst.mockResolvedValue(makeSantri());
      mockPrismaService.pelanggaran.create.mockResolvedValue(makePelanggaran({ poin: 25 }));
      mockPrismaService.pelanggaran.aggregate.mockResolvedValue({ _sum: { poin: 65 } });

      await service.createPelanggaran(TENANT_ID, dto, USER_ID);

      expect(mockAuditLogService.log).toHaveBeenCalledWith(
        expect.objectContaining({ aksi: 'THRESHOLD_PEMBINAAN_TERCAPAI' }),
      );
    });

    it('should log THRESHOLD_KRITIS when total poin >= 100', async () => {
      mockPrismaService.santri.findFirst.mockResolvedValue(makeSantri());
      mockPrismaService.pelanggaran.create.mockResolvedValue(makePelanggaran({ poin: 40 }));
      mockPrismaService.pelanggaran.aggregate.mockResolvedValue({ _sum: { poin: 105 } });

      await service.createPelanggaran(TENANT_ID, dto, USER_ID);

      expect(mockAuditLogService.log).toHaveBeenCalledWith(
        expect.objectContaining({ aksi: 'THRESHOLD_KRITIS_TERCAPAI' }),
      );
    });
  });

  // ─── getSummaryPelanggaran ─────────────────────────────────────────────────

  describe('getSummaryPelanggaran', () => {
    it('should return NORMAL status when poin < 30', async () => {
      mockPrismaService.pelanggaran.findMany.mockResolvedValue([]);
      mockPrismaService.pelanggaran.aggregate.mockResolvedValue({ _sum: { poin: 10 } });

      const result = await service.getSummaryPelanggaran(TENANT_ID, SANTRI_ID);
      expect(result.status).toBe('NORMAL');
      expect(result.totalPoin).toBe(10);
    });

    it('should return PERINGATAN status when poin >= 30', async () => {
      mockPrismaService.pelanggaran.findMany.mockResolvedValue([]);
      mockPrismaService.pelanggaran.aggregate.mockResolvedValue({ _sum: { poin: 30 } });

      const result = await service.getSummaryPelanggaran(TENANT_ID, SANTRI_ID);
      expect(result.status).toBe('PERINGATAN');
    });

    it('should return PERLU_PEMBINAAN status when poin >= 60', async () => {
      mockPrismaService.pelanggaran.findMany.mockResolvedValue([]);
      mockPrismaService.pelanggaran.aggregate.mockResolvedValue({ _sum: { poin: 60 } });

      const result = await service.getSummaryPelanggaran(TENANT_ID, SANTRI_ID);
      expect(result.status).toBe('PERLU_PEMBINAAN');
    });

    it('should return KRITIS status when poin >= 100', async () => {
      mockPrismaService.pelanggaran.findMany.mockResolvedValue([]);
      mockPrismaService.pelanggaran.aggregate.mockResolvedValue({ _sum: { poin: 100 } });

      const result = await service.getSummaryPelanggaran(TENANT_ID, SANTRI_ID);
      expect(result.status).toBe('KRITIS');
    });
  });

  // ─── createReward ──────────────────────────────────────────────────────────

  describe('createReward', () => {
    const rewardDto = {
      santriId: SANTRI_ID,
      poin: 20,
      keterangan: 'Juara kelas',
    };

    it('should create reward poin and log to audit', async () => {
      mockPrismaService.santri.findFirst.mockResolvedValue(makeSantri());
      mockPrismaService.rewardPoin.create.mockResolvedValue({
        id: 'reward-001',
        santriId: SANTRI_ID,
        poin: 20,
        keterangan: 'Juara kelas',
        serverTimestamp: new Date(),
        createdBy: USER_ID,
      });

      const result = await service.createReward(TENANT_ID, rewardDto, USER_ID);

      expect(result.poin).toBe(20);
      expect(mockAuditLogService.log).toHaveBeenCalledWith(
        expect.objectContaining({ aksi: 'CREATE_REWARD_POIN' }),
      );
    });

    it('should throw NotFoundException if santri not found', async () => {
      mockPrismaService.santri.findFirst.mockResolvedValue(null);

      await expect(service.createReward(TENANT_ID, rewardDto, USER_ID)).rejects.toThrow(NotFoundException);
    });

    it('should send WA notification when wali has phone', async () => {
      const santriWithWali = makeSantri({
        walis: [
          { isPrimary: true, wali: { id: 'wali-001', namaLengkap: 'Bapak Ahmad', noHp: '08123456789' } },
        ],
      });
      mockPrismaService.santri.findFirst.mockResolvedValue(santriWithWali);
      mockPrismaService.rewardPoin.create.mockResolvedValue({
        id: 'reward-001',
        santriId: SANTRI_ID,
        poin: 20,
        keterangan: 'Juara kelas',
        serverTimestamp: new Date(),
        createdBy: USER_ID,
      });

      await service.createReward(TENANT_ID, rewardDto, USER_ID);

      expect(mockWaQueueService.enqueue).toHaveBeenCalledWith(
        expect.objectContaining({ tipeNotifikasi: 'reward', noTujuan: '08123456789' }),
      );
    });
  });

  // ─── findAllPelanggaran ────────────────────────────────────────────────────

  describe('findAllPelanggaran', () => {
    it('should return list of pelanggaran for tenant', async () => {
      mockPrismaService.pelanggaran.findMany.mockResolvedValue([makePelanggaran()]);

      const result = await service.findAllPelanggaran(TENANT_ID);
      expect(result).toHaveLength(1);
    });

    it('should filter by santriId when provided', async () => {
      mockPrismaService.pelanggaran.findMany.mockResolvedValue([makePelanggaran()]);

      await service.findAllPelanggaran(TENANT_ID, { santriId: SANTRI_ID });

      expect(mockPrismaService.pelanggaran.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ santriId: SANTRI_ID }),
        }),
      );
    });
  });
});
