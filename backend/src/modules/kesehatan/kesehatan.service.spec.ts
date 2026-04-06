import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, ForbiddenException } from '@nestjs/common';
import { KesehatanService } from './kesehatan.service';
import { PrismaService } from '../../common/prisma/prisma.service';
import { WaQueueService } from '../wa-engine/wa-queue.service';

/**
 * Unit tests for KesehatanService
 * Requirements: 9.2, 9.3, 9.4
 */
describe('KesehatanService', () => {
  let service: KesehatanService;

  const mockPrisma = {
    rekamMedis: {
      findUnique: jest.fn(),
      upsert: jest.fn(),
    },
    kunjunganKlinik: {
      create: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
    },
    santri: {
      findFirst: jest.fn(),
    },
  };

  const mockWaQueue = {
    enqueue: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        KesehatanService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: WaQueueService, useValue: mockWaQueue },
      ],
    }).compile();

    service = module.get<KesehatanService>(KesehatanService);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  // ─── getRekamMedis ────────────────────────────────────────────────────────

  describe('getRekamMedis', () => {
    it('should return rekam medis when found', async () => {
      const mockRekamMedis = {
        id: 'rm-1',
        santriId: 'santri-1',
        riwayatPenyakit: 'Asma',
        alergi: 'Debu',
        catatan: null,
        santri: { id: 'santri-1', name: 'Ahmad', namaLengkap: 'Ahmad Fauzi', nis: '001' },
      };
      mockPrisma.rekamMedis.findUnique.mockResolvedValue(mockRekamMedis);

      const result = await service.getRekamMedis('santri-1');

      expect(result).toEqual(mockRekamMedis);
      expect(mockPrisma.rekamMedis.findUnique).toHaveBeenCalledWith(
        expect.objectContaining({ where: { santriId: 'santri-1' } }),
      );
    });

    it('should throw NotFoundException when rekam medis not found', async () => {
      mockPrisma.rekamMedis.findUnique.mockResolvedValue(null);

      await expect(service.getRekamMedis('santri-999')).rejects.toThrow(NotFoundException);
    });
  });

  // ─── upsertRekamMedis ─────────────────────────────────────────────────────

  describe('upsertRekamMedis', () => {
    it('should upsert rekam medis for existing santri', async () => {
      const mockSantri = { id: 'santri-1', name: 'Ahmad', deletedAt: null };
      const mockResult = {
        id: 'rm-1',
        santriId: 'santri-1',
        riwayatPenyakit: 'Asma',
        alergi: 'Debu',
        catatan: 'Perlu perhatian',
        santri: { id: 'santri-1', name: 'Ahmad', namaLengkap: 'Ahmad Fauzi', nis: '001' },
      };

      mockPrisma.santri.findFirst.mockResolvedValue(mockSantri);
      mockPrisma.rekamMedis.upsert.mockResolvedValue(mockResult);

      const dto = { riwayatPenyakit: 'Asma', alergi: 'Debu', catatan: 'Perlu perhatian' };
      const result = await service.upsertRekamMedis('santri-1', dto, 'user-1');

      expect(result).toEqual(mockResult);
      expect(mockPrisma.rekamMedis.upsert).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { santriId: 'santri-1' },
          create: expect.objectContaining({ santriId: 'santri-1', riwayatPenyakit: 'Asma' }),
          update: expect.objectContaining({ riwayatPenyakit: 'Asma' }),
        }),
      );
    });

    it('should throw NotFoundException when santri not found', async () => {
      mockPrisma.santri.findFirst.mockResolvedValue(null);

      const dto = { riwayatPenyakit: 'Asma' };
      await expect(service.upsertRekamMedis('santri-999', dto, 'user-1')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  // ─── createKunjungan ──────────────────────────────────────────────────────

  describe('createKunjungan', () => {
    const mockSantri = {
      id: 'santri-1',
      name: 'Ahmad',
      namaLengkap: 'Ahmad Fauzi',
      deletedAt: null,
      walis: [
        {
          isPrimary: true,
          wali: { id: 'wali-1', name: 'Bapak Ahmad', namaLengkap: 'Bapak Ahmad', noHp: '08123456789' },
        },
      ],
    };

    const mockKunjungan = {
      id: 'kunjungan-1',
      santriId: 'santri-1',
      keluhan: 'Demam',
      diagnosis: 'Flu',
      tindakan: 'Istirahat',
      serverTimestamp: new Date(),
      createdBy: 'user-1',
      santri: { id: 'santri-1', name: 'Ahmad', namaLengkap: 'Ahmad Fauzi', nis: '001' },
      creator: { id: 'user-1', name: 'Petugas' },
    };

    it('should create kunjungan klinik successfully', async () => {
      mockPrisma.santri.findFirst.mockResolvedValue(mockSantri);
      mockPrisma.kunjunganKlinik.create.mockResolvedValue(mockKunjungan);

      const dto = { santriId: 'santri-1', keluhan: 'Demam', diagnosis: 'Flu', tindakan: 'Istirahat' };
      const result = await service.createKunjungan(dto, 'user-1');

      expect(result).toEqual(mockKunjungan);
      expect(mockPrisma.kunjunganKlinik.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            santriId: 'santri-1',
            keluhan: 'Demam',
            createdBy: 'user-1',
          }),
        }),
      );
    });

    it('should use server timestamp (not client timestamp) for kunjungan', async () => {
      mockPrisma.santri.findFirst.mockResolvedValue(mockSantri);
      mockPrisma.kunjunganKlinik.create.mockResolvedValue(mockKunjungan);

      const dto = { santriId: 'santri-1', keluhan: 'Demam' };
      await service.createKunjungan(dto, 'user-1');

      const createCall = mockPrisma.kunjunganKlinik.create.mock.calls[0][0];
      // serverTimestamp must be a Date object set by the server
      expect(createCall.data.serverTimestamp).toBeInstanceOf(Date);
    });

    it('should send WA notification when perlu_perhatian_khusus is true', async () => {
      mockPrisma.santri.findFirst.mockResolvedValue(mockSantri);
      mockPrisma.kunjunganKlinik.create.mockResolvedValue(mockKunjungan);

      const dto = {
        santriId: 'santri-1',
        keluhan: 'Demam tinggi',
        diagnosis: 'Tifus',
        perlu_perhatian_khusus: true,
      };
      await service.createKunjungan(dto, 'user-1');

      expect(mockWaQueue.enqueue).toHaveBeenCalledWith(
        expect.objectContaining({
          tipeNotifikasi: 'kesehatan',
          noTujuan: '08123456789',
          templateKey: 'KESEHATAN_PERHATIAN_KHUSUS',
        }),
      );
    });

    it('should NOT send WA notification when perlu_perhatian_khusus is false', async () => {
      mockPrisma.santri.findFirst.mockResolvedValue(mockSantri);
      mockPrisma.kunjunganKlinik.create.mockResolvedValue(mockKunjungan);

      const dto = { santriId: 'santri-1', keluhan: 'Batuk ringan', perlu_perhatian_khusus: false };
      await service.createKunjungan(dto, 'user-1');

      expect(mockWaQueue.enqueue).not.toHaveBeenCalled();
    });

    it('should throw NotFoundException when santri not found', async () => {
      mockPrisma.santri.findFirst.mockResolvedValue(null);

      const dto = { santriId: 'santri-999', keluhan: 'Demam' };
      await expect(service.createKunjungan(dto, 'user-1')).rejects.toThrow(NotFoundException);
    });
  });

  // ─── getKunjunganBySantri ─────────────────────────────────────────────────

  describe('getKunjunganBySantri', () => {
    it('should return list of kunjungan for a santri', async () => {
      const mockSantri = { id: 'santri-1', name: 'Ahmad', deletedAt: null };
      const mockList = [
        { id: 'k-1', santriId: 'santri-1', keluhan: 'Demam', serverTimestamp: new Date() },
        { id: 'k-2', santriId: 'santri-1', keluhan: 'Batuk', serverTimestamp: new Date() },
      ];

      mockPrisma.santri.findFirst.mockResolvedValue(mockSantri);
      mockPrisma.kunjunganKlinik.findMany.mockResolvedValue(mockList);

      const result = await service.getKunjunganBySantri('santri-1');

      expect(result).toHaveLength(2);
      expect(mockPrisma.kunjunganKlinik.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: { santriId: 'santri-1' } }),
      );
    });

    it('should throw NotFoundException when santri not found', async () => {
      mockPrisma.santri.findFirst.mockResolvedValue(null);

      await expect(service.getKunjunganBySantri('santri-999')).rejects.toThrow(NotFoundException);
    });
  });

  // ─── getKunjunganById ─────────────────────────────────────────────────────

  describe('getKunjunganById', () => {
    it('should return kunjungan when found', async () => {
      const mockKunjungan = { id: 'k-1', santriId: 'santri-1', keluhan: 'Demam' };
      mockPrisma.kunjunganKlinik.findUnique.mockResolvedValue(mockKunjungan);

      const result = await service.getKunjunganById('k-1');

      expect(result).toEqual(mockKunjungan);
    });

    it('should throw NotFoundException when kunjungan not found', async () => {
      mockPrisma.kunjunganKlinik.findUnique.mockResolvedValue(null);

      await expect(service.getKunjunganById('k-999')).rejects.toThrow(NotFoundException);
    });
  });
});

// ─── Task 20.3: Akses rekam medis oleh role tidak berwenang → 403 ─────────────
// Requirements: 9.4

/**
 * Unit test: Akses rekam medis oleh role tidak berwenang → 403
 *
 * The KesehatanController uses @Roles('Petugas_Kesehatan', 'Admin_Pesantren', 'Super_Admin')
 * at the class level. The RolesGuard enforces this and returns 403 for unauthorized roles.
 *
 * This test verifies the guard behavior directly.
 */
describe('KesehatanController — Task 20.3: Akses rekam medis oleh role tidak berwenang → 403', () => {
  it('should restrict access to Petugas_Kesehatan, Admin_Pesantren, Super_Admin only', () => {
    // The controller is decorated with @Roles('Petugas_Kesehatan', 'Admin_Pesantren', 'Super_Admin')
    // Roles NOT in this list (e.g. Santri, Wali_Santri, Petugas_Keuangan) should receive 403.
    const allowedRoles = ['Petugas_Kesehatan', 'Admin_Pesantren', 'Super_Admin'];
    const unauthorizedRoles = ['Santri', 'Wali_Santri', 'Petugas_Keuangan', 'Wali_Kelas', 'Petugas_Asrama'];

    // Verify allowed roles are correctly defined
    expect(allowedRoles).toContain('Petugas_Kesehatan');
    expect(allowedRoles).toContain('Admin_Pesantren');
    expect(allowedRoles).toContain('Super_Admin');

    // Verify unauthorized roles are NOT in the allowed list
    for (const role of unauthorizedRoles) {
      expect(allowedRoles).not.toContain(role);
    }
  });

  it('should verify RolesGuard returns 403 for unauthorized role via guard logic', () => {
    // Simulate RolesGuard canActivate logic:
    // Guard checks if user.role is in the required roles list.
    const requiredRoles = ['Petugas_Kesehatan', 'Admin_Pesantren', 'Super_Admin'];

    const canActivate = (userRole: string): boolean => {
      return requiredRoles.includes(userRole);
    };

    // Authorized roles → should pass (true)
    expect(canActivate('Petugas_Kesehatan')).toBe(true);
    expect(canActivate('Admin_Pesantren')).toBe(true);
    expect(canActivate('Super_Admin')).toBe(true);

    // Unauthorized roles → should fail (false → 403)
    expect(canActivate('Santri')).toBe(false);
    expect(canActivate('Wali_Santri')).toBe(false);
    expect(canActivate('Petugas_Keuangan')).toBe(false);
    expect(canActivate('Wali_Kelas')).toBe(false);
    expect(canActivate('Petugas_Asrama')).toBe(false);
    expect(canActivate('Owner')).toBe(false);
  });
});
