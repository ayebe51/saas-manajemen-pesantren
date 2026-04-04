import { Test, TestingModule } from '@nestjs/testing';
import { WaQueueService } from './wa-queue.service';
import { PrismaService } from '../../common/prisma/prisma.service';

/**
 * Unit test: Kegagalan WA tidak menggagalkan operasi bisnis utama
 * Requirements: 18.7
 */
describe('WaQueueService', () => {
  let service: WaQueueService;
  let mockPrisma: { waQueue: { create: jest.Mock } };

  beforeEach(async () => {
    mockPrisma = {
      waQueue: {
        create: jest.fn(),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        WaQueueService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get<WaQueueService>(WaQueueService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('enqueue (fire-and-forget)', () => {
    it('tidak memblokir caller meskipun DB insert gagal', async () => {
      // Simulasi DB error
      mockPrisma.waQueue.create.mockRejectedValue(new Error('DB connection failed'));

      // enqueue() tidak throw — tidak memblokir operasi bisnis
      expect(() => {
        service.enqueue({
          tipeNotifikasi: 'PEMBAYARAN_BERHASIL',
          noTujuan: '628123456789',
          templateKey: 'PEMBAYARAN_BERHASIL',
          payload: { santri_nama: 'Ahmad', jumlah: '500000' },
        });
      }).not.toThrow();

      // Tunggu sebentar agar promise rejection diproses
      await new Promise((resolve) => setTimeout(resolve, 50));

      // DB create dipanggil (fire-and-forget)
      expect(mockPrisma.waQueue.create).toHaveBeenCalledTimes(1);
    });

    it('tidak memblokir caller saat DB insert berhasil', async () => {
      mockPrisma.waQueue.create.mockResolvedValue({ id: 'test-id-123' });

      const startTime = Date.now();

      // enqueue() harus return segera (tidak await DB)
      service.enqueue({
        tipeNotifikasi: 'PRESENSI_MASUK',
        noTujuan: '628987654321',
        templateKey: 'PRESENSI_MASUK',
        payload: { santri_nama: 'Budi', sesi_nama: 'Subuh', waktu: '05:00' },
      });

      const elapsed = Date.now() - startTime;

      // Harus selesai hampir instan (< 10ms) karena fire-and-forget
      expect(elapsed).toBeLessThan(10);
    });

    it('memanggil prisma.waQueue.create dengan data yang benar', async () => {
      mockPrisma.waQueue.create.mockResolvedValue({ id: 'abc-123' });

      service.enqueue({
        tipeNotifikasi: 'PELANGGARAN',
        noTujuan: '628111222333',
        templateKey: 'PELANGGARAN',
        payload: { santri_nama: 'Candra', pelanggaran_nama: 'Terlambat' },
      });

      // Tunggu promise selesai
      await new Promise((resolve) => setTimeout(resolve, 50));

      expect(mockPrisma.waQueue.create).toHaveBeenCalledWith({
        data: {
          tipeNotifikasi: 'PELANGGARAN',
          noTujuan: '628111222333',
          templateKey: 'PELANGGARAN',
          payload: { santri_nama: 'Candra', pelanggaran_nama: 'Terlambat' },
          status: 'PENDING',
          retryCount: 0,
        },
      });
    });
  });

  describe('enqueueAsync (awaitable)', () => {
    it('mengembalikan id saat berhasil', async () => {
      mockPrisma.waQueue.create.mockResolvedValue({ id: 'queue-id-456' });

      const result = await service.enqueueAsync({
        tipeNotifikasi: 'TOPUP_BERHASIL',
        noTujuan: '628444555666',
        templateKey: 'TOPUP_BERHASIL',
        payload: { santri_nama: 'Dani', jumlah: '100000', saldo_terkini: '350000' },
      });

      expect(result).toEqual({ id: 'queue-id-456' });
    });

    it('melempar error saat DB gagal (awaitable version)', async () => {
      mockPrisma.waQueue.create.mockRejectedValue(new Error('DB error'));

      await expect(
        service.enqueueAsync({
          tipeNotifikasi: 'REWARD',
          noTujuan: '628777888999',
          templateKey: 'REWARD',
          payload: { santri_nama: 'Eko', poin: '50' },
        }),
      ).rejects.toThrow('DB error');
    });
  });

  describe('Kegagalan WA tidak menggagalkan operasi bisnis utama', () => {
    it('operasi bisnis tetap berjalan meskipun WA queue gagal', async () => {
      // Simulasi: DB WA queue error
      mockPrisma.waQueue.create.mockRejectedValue(new Error('WA queue unavailable'));

      // Simulasi operasi bisnis (misalnya konfirmasi pembayaran)
      let businessOperationCompleted = false;

      const businessOperation = async () => {
        // Enqueue WA (fire-and-forget) — tidak await
        service.enqueue({
          tipeNotifikasi: 'PEMBAYARAN_BERHASIL',
          noTujuan: '628123456789',
          templateKey: 'PEMBAYARAN_BERHASIL',
          payload: { santri_nama: 'Fajar', jumlah: '750000' },
        });

        // Operasi bisnis utama tetap berjalan
        businessOperationCompleted = true;
        return { success: true, invoiceId: 'INV-2024-001' };
      };

      const result = await businessOperation();

      // Operasi bisnis berhasil
      expect(result.success).toBe(true);
      expect(businessOperationCompleted).toBe(true);

      // Tunggu promise WA selesai (gagal)
      await new Promise((resolve) => setTimeout(resolve, 50));

      // WA queue dipanggil tapi gagal — tidak mempengaruhi hasil bisnis
      expect(mockPrisma.waQueue.create).toHaveBeenCalledTimes(1);
    });
  });
});
