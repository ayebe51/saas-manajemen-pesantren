/**
 * Unit tests for ReportService
 * Requirements: 21.3, 21.5
 * Task 31.3: Unit test — generate laporan PDF dan Excel, filter parameter
 */
import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, ForbiddenException } from '@nestjs/common';
import { getQueueToken } from '@nestjs/bullmq';
import { ReportService } from './report.service';
import { PrismaService } from '../../common/prisma/prisma.service';
import { TipeLaporan, FormatLaporan } from './dto/generate-report.dto';

// ─── Mock factories ───────────────────────────────────────────────────────────

function buildMockPrisma() {
  return {
    reportJob: {
      create: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    santri: {
      findMany: jest.fn().mockResolvedValue([]),
    },
    attendance: {
      findMany: jest.fn().mockResolvedValue([]),
    },
    invoice: {
      findMany: jest.fn().mockResolvedValue([]),
    },
    pelanggaran: {
      findMany: jest.fn().mockResolvedValue([]),
    },
    kunjunganKlinik: {
      findMany: jest.fn().mockResolvedValue([]),
    },
    kunjunganTamu: {
      findMany: jest.fn().mockResolvedValue([]),
    },
    asrama: {
      findMany: jest.fn().mockResolvedValue([]),
    },
    pegawai: {
      findMany: jest.fn().mockResolvedValue([]),
    },
    koperasiTransaksi: {
      findMany: jest.fn().mockResolvedValue([]),
    },
  };
}

function buildMockQueue() {
  return {
    add: jest.fn().mockResolvedValue({ id: 'bull-job-1' }),
  };
}

// ─── Test Suite ───────────────────────────────────────────────────────────────

describe('ReportService', () => {
  let service: ReportService;
  let mockPrisma: ReturnType<typeof buildMockPrisma>;
  let mockQueue: ReturnType<typeof buildMockQueue>;

  const userId = 'user-uuid-1';
  const jobId = 'job-uuid-1';

  beforeEach(async () => {
    mockPrisma = buildMockPrisma();
    mockQueue = buildMockQueue();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ReportService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: getQueueToken('report'), useValue: mockQueue },
      ],
    }).compile();

    service = module.get<ReportService>(ReportService);
    jest.clearAllMocks();
  });

  // ─── enqueueReport ────────────────────────────────────────────────────────

  describe('enqueueReport()', () => {
    it('should create a ReportJob in DB and enqueue to BullMQ', async () => {
      const mockJob = {
        id: jobId,
        userId,
        tipe: TipeLaporan.SANTRI,
        status: 'PENDING',
        filter: { format: FormatLaporan.PDF },
        filePath: null,
        errorMsg: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      mockPrisma.reportJob.create.mockResolvedValue(mockJob);

      const result = await service.enqueueReport(userId, {
        tipe: TipeLaporan.SANTRI,
        format: FormatLaporan.PDF,
      });

      expect(mockPrisma.reportJob.create).toHaveBeenCalledTimes(1);
      expect(mockPrisma.reportJob.create.mock.calls[0][0].data).toMatchObject({
        userId,
        tipe: TipeLaporan.SANTRI,
        status: 'PENDING',
      });
      expect(mockQueue.add).toHaveBeenCalledWith(
        'generate-report',
        { jobId },
        expect.objectContaining({ attempts: 3 }),
      );
      expect(result.id).toBe(jobId);
      expect(result.status).toBe('PENDING');
    });

    it('should pass filter params (startDate, endDate, kelasId, asramaId) to the job', async () => {
      const mockJob = {
        id: jobId,
        userId,
        tipe: TipeLaporan.PRESENSI,
        status: 'PENDING',
        filter: {
          startDate: '2024-01-01',
          endDate: '2024-01-31',
          kelasId: 'kelas-1',
          format: FormatLaporan.EXCEL,
        },
        filePath: null,
        errorMsg: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      mockPrisma.reportJob.create.mockResolvedValue(mockJob);

      await service.enqueueReport(userId, {
        tipe: TipeLaporan.PRESENSI,
        format: FormatLaporan.EXCEL,
        startDate: '2024-01-01',
        endDate: '2024-01-31',
        kelasId: 'kelas-1',
      });

      const createData = mockPrisma.reportJob.create.mock.calls[0][0].data;
      expect(createData.filter).toMatchObject({
        startDate: '2024-01-01',
        endDate: '2024-01-31',
        kelasId: 'kelas-1',
        format: FormatLaporan.EXCEL,
      });
    });
  });

  // ─── getReportStatus ──────────────────────────────────────────────────────

  describe('getReportStatus()', () => {
    it('should return job status for the correct user', async () => {
      const mockJob = {
        id: jobId,
        userId,
        tipe: TipeLaporan.SANTRI,
        status: 'DONE',
        filePath: '/uploads/reports/job-uuid-1.pdf',
        errorMsg: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      mockPrisma.reportJob.findUnique.mockResolvedValue(mockJob);

      const result = await service.getReportStatus(jobId, userId);
      expect(result.status).toBe('DONE');
      expect(result.filePath).toBe('/uploads/reports/job-uuid-1.pdf');
    });

    it('should throw NotFoundException when job does not exist', async () => {
      mockPrisma.reportJob.findUnique.mockResolvedValue(null);

      await expect(service.getReportStatus('nonexistent', userId)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw ForbiddenException when job belongs to another user', async () => {
      mockPrisma.reportJob.findUnique.mockResolvedValue({
        id: jobId,
        userId: 'other-user',
        status: 'DONE',
      });

      await expect(service.getReportStatus(jobId, userId)).rejects.toThrow(
        ForbiddenException,
      );
    });
  });

  // ─── downloadReport ───────────────────────────────────────────────────────

  describe('downloadReport()', () => {
    it('should return filePath when job is DONE', async () => {
      const filePath = '/uploads/reports/job-uuid-1.pdf';
      mockPrisma.reportJob.findUnique.mockResolvedValue({
        id: jobId,
        userId,
        status: 'DONE',
        filePath,
      });

      const result = await service.downloadReport(jobId, userId);
      expect(result).toBe(filePath);
    });

    it('should throw NotFoundException when job is not DONE', async () => {
      mockPrisma.reportJob.findUnique.mockResolvedValue({
        id: jobId,
        userId,
        status: 'PROCESSING',
        filePath: null,
      });

      await expect(service.downloadReport(jobId, userId)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw NotFoundException when filePath is null even if status is DONE', async () => {
      mockPrisma.reportJob.findUnique.mockResolvedValue({
        id: jobId,
        userId,
        status: 'DONE',
        filePath: null,
      });

      await expect(service.downloadReport(jobId, userId)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  // ─── generateExcelReport (legacy) ────────────────────────────────────────

  describe('generateExcelReport() — legacy', () => {
    it('should return a Buffer for santri module', async () => {
      mockPrisma.santri.findMany.mockResolvedValue([
        { nisn: '12345', name: 'Ahmad', gender: 'L' },
        { nisn: '67890', name: 'Budi', gender: 'L' },
      ]);

      const buffer = await service.generateExcelReport('tenant-1', 'santri');
      expect(Buffer.isBuffer(buffer)).toBe(true);
      expect(buffer.length).toBeGreaterThan(0);
    });

    it('should return a Buffer for unknown module (fallback)', async () => {
      const buffer = await service.generateExcelReport('tenant-1', 'unknown-module');
      expect(Buffer.isBuffer(buffer)).toBe(true);
    });
  });

  // ─── generatePdfReport (legacy) ──────────────────────────────────────────

  describe('generatePdfReport() — legacy', () => {
    it('should call buildPdf with correct title and rows', async () => {
      // Spy on the private buildPdf method to avoid actual PDF generation in tests
      const buildPdfSpy = jest
        .spyOn(service as any, 'buildPdf')
        .mockResolvedValue(Buffer.from('mock-pdf'));

      const buffer = await service.generatePdfReport('tenant-1', 'Test Report', [
        { description: 'Item 1', value: '100' },
        { description: 'Item 2', value: '200' },
      ]);

      expect(buildPdfSpy).toHaveBeenCalledWith(
        'Test Report',
        ['No', 'Deskripsi', 'Nilai'],
        expect.arrayContaining([
          expect.arrayContaining([1, 'Item 1', '100']),
          expect.arrayContaining([2, 'Item 2', '200']),
        ]),
      );
      expect(Buffer.isBuffer(buffer)).toBe(true);
    });

    it('should call buildPdf with empty rows for empty content data', async () => {
      const buildPdfSpy = jest
        .spyOn(service as any, 'buildPdf')
        .mockResolvedValue(Buffer.from('mock-pdf-empty'));

      const buffer = await service.generatePdfReport('tenant-1', 'Empty Report', []);
      expect(buildPdfSpy).toHaveBeenCalledWith('Empty Report', expect.any(Array), []);
      expect(Buffer.isBuffer(buffer)).toBe(true);
    });
  });

  // ─── Filter parameter tests ───────────────────────────────────────────────

  describe('Filter parameters — Requirements 21.5', () => {
    it('should apply startDate and endDate filter when generating santri report', async () => {
      mockPrisma.santri.findMany.mockResolvedValue([]);

      await service.generateSantriReport(
        { startDate: '2024-01-01', endDate: '2024-12-31', format: FormatLaporan.EXCEL },
        jobId,
      );

      const callArgs = mockPrisma.santri.findMany.mock.calls[0][0];
      expect(callArgs.where.createdAt).toBeDefined();
      expect(callArgs.where.createdAt.gte).toBeInstanceOf(Date);
      expect(callArgs.where.createdAt.lte).toBeInstanceOf(Date);
    });

    it('should apply kelasId filter when generating santri report', async () => {
      mockPrisma.santri.findMany.mockResolvedValue([]);

      await service.generateSantriReport(
        { kelasId: 'kelas-7a', format: FormatLaporan.EXCEL },
        jobId,
      );

      const callArgs = mockPrisma.santri.findMany.mock.calls[0][0];
      expect(callArgs.where.kelasId).toBe('kelas-7a');
    });

    it('should apply asramaId filter when generating asrama report', async () => {
      mockPrisma.asrama.findMany.mockResolvedValue([]);

      await service.generateAsramaReport(
        { asramaId: 'asrama-1', format: FormatLaporan.EXCEL },
        jobId,
      );

      const callArgs = mockPrisma.asrama.findMany.mock.calls[0][0];
      expect(callArgs.where.id).toBe('asrama-1');
    });

    it('should not apply date filter when no dates provided', async () => {
      mockPrisma.santri.findMany.mockResolvedValue([]);

      await service.generateSantriReport({ format: FormatLaporan.EXCEL }, jobId);

      const callArgs = mockPrisma.santri.findMany.mock.calls[0][0];
      expect(callArgs.where.createdAt).toBeUndefined();
    });
  });
});
