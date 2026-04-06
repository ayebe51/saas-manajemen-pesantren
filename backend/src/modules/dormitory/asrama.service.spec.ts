import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, HttpException, HttpStatus } from '@nestjs/common';
import { AsramaService } from './asrama.service';
import { PrismaService } from '../../common/prisma/prisma.service';

/**
 * Unit tests for AsramaService
 * Requirements: 15.1, 15.2, 15.3, 15.4
 */
describe('AsramaService', () => {
  let service: AsramaService;

  const mockPrisma = {
    asrama: {
      create: jest.fn(),
      findMany: jest.fn(),
      findFirst: jest.fn(),
    },
    kamar: {
      create: jest.fn(),
      findMany: jest.fn(),
      findFirst: jest.fn(),
      update: jest.fn(),
    },
    santri: {
      findFirst: jest.fn(),
    },
    penempatanSantri: {
      count: jest.fn(),
      create: jest.fn(),
      findMany: jest.fn(),
      updateMany: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AsramaService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get<AsramaService>(AsramaService);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  // ─── createAsrama ─────────────────────────────────────────────────────────

  describe('createAsrama', () => {
    it('should create a new asrama', async () => {
      const mockAsrama = { id: 'asrama-1', tenantId: 'tenant-1', nama: 'Asrama Al-Fatih', deskripsi: null };
      mockPrisma.asrama.create.mockResolvedValue(mockAsrama);

      const dto = { nama: 'Asrama Al-Fatih' };
      const result = await service.createAsrama('tenant-1', dto);

      expect(result).toEqual(mockAsrama);
      expect(mockPrisma.asrama.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ tenantId: 'tenant-1', nama: 'Asrama Al-Fatih' }),
        }),
      );
    });
  });

  // ─── createKamar ──────────────────────────────────────────────────────────

  describe('createKamar', () => {
    it('should create a kamar when asrama exists', async () => {
      const mockAsrama = { id: 'asrama-1', tenantId: 'tenant-1', nama: 'Asrama Al-Fatih' };
      const mockKamar = { id: 'kamar-1', asramaId: 'asrama-1', nama: 'A1', kapasitas: 4, lantai: 1, status: 'TERSEDIA' };

      mockPrisma.asrama.findFirst.mockResolvedValue(mockAsrama);
      mockPrisma.kamar.create.mockResolvedValue(mockKamar);

      const dto = { asramaId: 'asrama-1', nama: 'A1', kapasitas: 4, lantai: 1 };
      const result = await service.createKamar('tenant-1', dto);

      expect(result).toEqual(mockKamar);
    });

    it('should throw NotFoundException when asrama not found', async () => {
      mockPrisma.asrama.findFirst.mockResolvedValue(null);

      const dto = { asramaId: 'asrama-999', nama: 'A1', kapasitas: 4 };
      await expect(service.createKamar('tenant-1', dto)).rejects.toThrow(NotFoundException);
    });
  });

  // ─── Task 22.3: Penempatan melebihi kapasitas → 422 ──────────────────────
  // Requirements: 15.2, 15.3

  describe('assignSantri — Task 22.3: Penempatan melebihi kapasitas → 422', () => {
    const mockKamar = {
      id: 'kamar-1',
      nama: 'A1',
      kapasitas: 2,
      status: 'TERSEDIA',
    };

    const mockSantri = {
      id: 'santri-1',
      name: 'Ahmad',
      tenantId: 'tenant-1',
      deletedAt: null,
    };

    it('should throw 422 when kamar is at full capacity', async () => {
      mockPrisma.kamar.findFirst.mockResolvedValue(mockKamar);
      mockPrisma.santri.findFirst.mockResolvedValue(mockSantri);
      // Kamar sudah penuh (jumlahAktif >= kapasitas)
      mockPrisma.penempatanSantri.count.mockResolvedValue(2); // kapasitas = 2, sudah penuh

      const dto = { santriId: 'santri-1', kamarId: 'kamar-1' };

      await expect(service.assignSantri('tenant-1', dto)).rejects.toThrow(HttpException);

      try {
        await service.assignSantri('tenant-1', dto);
      } catch (err) {
        expect(err).toBeInstanceOf(HttpException);
        expect((err as HttpException).getStatus()).toBe(HttpStatus.UNPROCESSABLE_ENTITY);
        expect((err as HttpException).message).toContain('penuh');
      }
    });

    it('should throw 422 when kamar exceeds capacity (count > kapasitas)', async () => {
      mockPrisma.kamar.findFirst.mockResolvedValue({ ...mockKamar, kapasitas: 1 });
      mockPrisma.santri.findFirst.mockResolvedValue(mockSantri);
      mockPrisma.penempatanSantri.count.mockResolvedValue(1); // kapasitas = 1, sudah penuh

      const dto = { santriId: 'santri-1', kamarId: 'kamar-1' };

      await expect(service.assignSantri('tenant-1', dto)).rejects.toThrow(HttpException);
    });

    it('should successfully assign santri when kamar has available space', async () => {
      const mockPenempatan = {
        id: 'penempatan-1',
        santriId: 'santri-1',
        kamarId: 'kamar-1',
        tanggalMasuk: new Date(),
        isAktif: true,
        santri: { id: 'santri-1', name: 'Ahmad', nis: '001' },
        kamar: { id: 'kamar-1', nama: 'A1', asrama: { nama: 'Asrama Al-Fatih' } },
      };

      mockPrisma.kamar.findFirst.mockResolvedValue(mockKamar);
      mockPrisma.santri.findFirst.mockResolvedValue(mockSantri);
      mockPrisma.penempatanSantri.count.mockResolvedValue(1); // kapasitas = 2, masih ada 1 slot
      mockPrisma.penempatanSantri.updateMany.mockResolvedValue({ count: 0 });
      mockPrisma.penempatanSantri.create.mockResolvedValue(mockPenempatan);
      mockPrisma.kamar.update.mockResolvedValue({ ...mockKamar, status: 'PENUH' });

      const dto = { santriId: 'santri-1', kamarId: 'kamar-1' };
      const result = await service.assignSantri('tenant-1', dto);

      expect(result).toEqual(mockPenempatan);
      expect(mockPrisma.penempatanSantri.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            santriId: 'santri-1',
            kamarId: 'kamar-1',
            isAktif: true,
          }),
        }),
      );
    });

    it('should throw NotFoundException when kamar not found', async () => {
      mockPrisma.kamar.findFirst.mockResolvedValue(null);

      const dto = { santriId: 'santri-1', kamarId: 'kamar-999' };
      await expect(service.assignSantri('tenant-1', dto)).rejects.toThrow(NotFoundException);
    });

    it('should throw NotFoundException when santri not found', async () => {
      mockPrisma.kamar.findFirst.mockResolvedValue(mockKamar);
      mockPrisma.santri.findFirst.mockResolvedValue(null);

      const dto = { santriId: 'santri-999', kamarId: 'kamar-1' };
      await expect(service.assignSantri('tenant-1', dto)).rejects.toThrow(NotFoundException);
    });
  });

  // ─── Task 22.3: Riwayat perpindahan tersimpan ─────────────────────────────
  // Requirements: 15.4

  describe('assignSantri — Task 22.3: Riwayat perpindahan tersimpan', () => {
    const mockKamarBaru = { id: 'kamar-2', nama: 'B1', kapasitas: 4, status: 'TERSEDIA' };
    const mockSantri = { id: 'santri-1', name: 'Ahmad', tenantId: 'tenant-1', deletedAt: null };

    it('should close previous active placement before creating new one', async () => {
      const mockPenempatan = {
        id: 'penempatan-2',
        santriId: 'santri-1',
        kamarId: 'kamar-2',
        tanggalMasuk: new Date(),
        isAktif: true,
        santri: { id: 'santri-1', name: 'Ahmad', nis: '001' },
        kamar: { id: 'kamar-2', nama: 'B1', asrama: { nama: 'Asrama Al-Fatih' } },
      };

      mockPrisma.kamar.findFirst.mockResolvedValue(mockKamarBaru);
      mockPrisma.santri.findFirst.mockResolvedValue(mockSantri);
      mockPrisma.penempatanSantri.count.mockResolvedValue(0);
      mockPrisma.penempatanSantri.updateMany.mockResolvedValue({ count: 1 }); // 1 penempatan lama ditutup
      mockPrisma.penempatanSantri.create.mockResolvedValue(mockPenempatan);
      mockPrisma.kamar.update.mockResolvedValue({});

      const dto = { santriId: 'santri-1', kamarId: 'kamar-2' };
      await service.assignSantri('tenant-1', dto);

      // Harus menutup penempatan aktif sebelumnya
      expect(mockPrisma.penempatanSantri.updateMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ santriId: 'santri-1', isAktif: true }),
          data: expect.objectContaining({ isAktif: false }),
        }),
      );
    });

    it('should set tanggalKeluar when closing previous placement (riwayat tersimpan)', async () => {
      const mockPenempatan = {
        id: 'penempatan-2',
        santriId: 'santri-1',
        kamarId: 'kamar-2',
        tanggalMasuk: new Date(),
        isAktif: true,
        santri: { id: 'santri-1', name: 'Ahmad', nis: '001' },
        kamar: { id: 'kamar-2', nama: 'B1', asrama: { nama: 'Asrama Al-Fatih' } },
      };

      mockPrisma.kamar.findFirst.mockResolvedValue(mockKamarBaru);
      mockPrisma.santri.findFirst.mockResolvedValue(mockSantri);
      mockPrisma.penempatanSantri.count.mockResolvedValue(0);
      mockPrisma.penempatanSantri.updateMany.mockResolvedValue({ count: 1 });
      mockPrisma.penempatanSantri.create.mockResolvedValue(mockPenempatan);
      mockPrisma.kamar.update.mockResolvedValue({});

      const dto = { santriId: 'santri-1', kamarId: 'kamar-2' };
      await service.assignSantri('tenant-1', dto);

      // tanggalKeluar harus di-set saat menutup penempatan lama
      const updateManyCall = mockPrisma.penempatanSantri.updateMany.mock.calls[0][0];
      expect(updateManyCall.data.tanggalKeluar).toBeInstanceOf(Date);
      expect(updateManyCall.data.isAktif).toBe(false);
    });

    it('should create new placement with isAktif: true (riwayat baru tersimpan)', async () => {
      const mockPenempatan = {
        id: 'penempatan-2',
        santriId: 'santri-1',
        kamarId: 'kamar-2',
        tanggalMasuk: new Date(),
        isAktif: true,
        santri: { id: 'santri-1', name: 'Ahmad', nis: '001' },
        kamar: { id: 'kamar-2', nama: 'B1', asrama: { nama: 'Asrama Al-Fatih' } },
      };

      mockPrisma.kamar.findFirst.mockResolvedValue(mockKamarBaru);
      mockPrisma.santri.findFirst.mockResolvedValue(mockSantri);
      mockPrisma.penempatanSantri.count.mockResolvedValue(0);
      mockPrisma.penempatanSantri.updateMany.mockResolvedValue({ count: 0 });
      mockPrisma.penempatanSantri.create.mockResolvedValue(mockPenempatan);
      mockPrisma.kamar.update.mockResolvedValue({});

      const dto = { santriId: 'santri-1', kamarId: 'kamar-2' };
      const result = await service.assignSantri('tenant-1', dto);

      // Penempatan baru harus aktif
      const createCall = mockPrisma.penempatanSantri.create.mock.calls[0][0];
      expect(createCall.data.isAktif).toBe(true);
      expect(createCall.data.santriId).toBe('santri-1');
      expect(createCall.data.kamarId).toBe('kamar-2');
    });
  });

  // ─── findPenempatanBySantri ───────────────────────────────────────────────

  describe('findPenempatanBySantri', () => {
    it('should return placement history for a santri', async () => {
      const mockSantri = { id: 'santri-1', name: 'Ahmad', tenantId: 'tenant-1', deletedAt: null };
      const mockHistory = [
        { id: 'p-1', santriId: 'santri-1', kamarId: 'kamar-1', isAktif: false, tanggalMasuk: new Date(), tanggalKeluar: new Date() },
        { id: 'p-2', santriId: 'santri-1', kamarId: 'kamar-2', isAktif: true, tanggalMasuk: new Date(), tanggalKeluar: null },
      ];

      mockPrisma.santri.findFirst.mockResolvedValue(mockSantri);
      mockPrisma.penempatanSantri.findMany.mockResolvedValue(mockHistory);

      const result = await service.findPenempatanBySantri('tenant-1', 'santri-1');

      expect(result).toHaveLength(2);
      // Riwayat lama (isAktif: false) harus tetap ada — tidak dihapus
      expect(result.some((p) => p.isAktif === false)).toBe(true);
    });

    it('should throw NotFoundException when santri not found', async () => {
      mockPrisma.santri.findFirst.mockResolvedValue(null);

      await expect(service.findPenempatanBySantri('tenant-1', 'santri-999')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  // ─── findPenempatanByKamar ────────────────────────────────────────────────

  describe('findPenempatanByKamar', () => {
    it('should return active occupants of a kamar', async () => {
      const mockKamar = { id: 'kamar-1', nama: 'A1', kapasitas: 4 };
      const mockOccupants = [
        { id: 'p-1', santriId: 'santri-1', kamarId: 'kamar-1', isAktif: true, santri: { id: 'santri-1', name: 'Ahmad', nis: '001', kelas: '7A' } },
      ];

      mockPrisma.kamar.findFirst.mockResolvedValue(mockKamar);
      mockPrisma.penempatanSantri.findMany.mockResolvedValue(mockOccupants);

      const result = await service.findPenempatanByKamar('tenant-1', 'kamar-1');

      expect(result).toHaveLength(1);
    });

    it('should throw NotFoundException when kamar not found', async () => {
      mockPrisma.kamar.findFirst.mockResolvedValue(null);

      await expect(service.findPenempatanByKamar('tenant-1', 'kamar-999')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  // ─── kamar status update when full ───────────────────────────────────────

  describe('assignSantri — kamar status update', () => {
    it('should update kamar status to PENUH when capacity is reached', async () => {
      const mockKamar = { id: 'kamar-1', nama: 'A1', kapasitas: 2, status: 'TERSEDIA' };
      const mockSantri = { id: 'santri-1', name: 'Ahmad', tenantId: 'tenant-1', deletedAt: null };
      const mockPenempatan = {
        id: 'p-1',
        santriId: 'santri-1',
        kamarId: 'kamar-1',
        isAktif: true,
        santri: { id: 'santri-1', name: 'Ahmad', nis: '001' },
        kamar: { id: 'kamar-1', nama: 'A1', asrama: { nama: 'Asrama Al-Fatih' } },
      };

      mockPrisma.kamar.findFirst.mockResolvedValue(mockKamar);
      mockPrisma.santri.findFirst.mockResolvedValue(mockSantri);
      // jumlahAktif = 1, kapasitas = 2 → setelah assign jadi 2 (penuh)
      mockPrisma.penempatanSantri.count.mockResolvedValue(1);
      mockPrisma.penempatanSantri.updateMany.mockResolvedValue({ count: 0 });
      mockPrisma.penempatanSantri.create.mockResolvedValue(mockPenempatan);
      mockPrisma.kamar.update.mockResolvedValue({ ...mockKamar, status: 'PENUH' });

      const dto = { santriId: 'santri-1', kamarId: 'kamar-1' };
      await service.assignSantri('tenant-1', dto);

      // Kamar harus diupdate ke status PENUH
      expect(mockPrisma.kamar.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'kamar-1' },
          data: { status: 'PENUH' },
        }),
      );
    });

    it('should NOT update kamar status when capacity is not yet reached', async () => {
      const mockKamar = { id: 'kamar-1', nama: 'A1', kapasitas: 4, status: 'TERSEDIA' };
      const mockSantri = { id: 'santri-1', name: 'Ahmad', tenantId: 'tenant-1', deletedAt: null };
      const mockPenempatan = {
        id: 'p-1',
        santriId: 'santri-1',
        kamarId: 'kamar-1',
        isAktif: true,
        santri: { id: 'santri-1', name: 'Ahmad', nis: '001' },
        kamar: { id: 'kamar-1', nama: 'A1', asrama: { nama: 'Asrama Al-Fatih' } },
      };

      mockPrisma.kamar.findFirst.mockResolvedValue(mockKamar);
      mockPrisma.santri.findFirst.mockResolvedValue(mockSantri);
      // jumlahAktif = 1, kapasitas = 4 → setelah assign jadi 2 (belum penuh)
      mockPrisma.penempatanSantri.count.mockResolvedValue(1);
      mockPrisma.penempatanSantri.updateMany.mockResolvedValue({ count: 0 });
      mockPrisma.penempatanSantri.create.mockResolvedValue(mockPenempatan);

      const dto = { santriId: 'santri-1', kamarId: 'kamar-1' };
      await service.assignSantri('tenant-1', dto);

      // Kamar TIDAK boleh diupdate ke PENUH
      expect(mockPrisma.kamar.update).not.toHaveBeenCalled();
    });
  });
});
