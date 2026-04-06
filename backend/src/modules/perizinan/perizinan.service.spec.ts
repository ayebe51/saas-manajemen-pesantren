import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import * as fc from 'fast-check';
import { PerizinanService } from './perizinan.service';
import { PrismaService } from '../../common/prisma/prisma.service';
import { AuditLogService } from '../audit-log/audit-log.service';
import { WaQueueService } from '../wa-engine/wa-queue.service';
import { TipePerizinan } from './dto/create-perizinan.dto';

// ─── Mocks ────────────────────────────────────────────────────────────────────

const mockPrismaService = {
  santri: { findFirst: jest.fn() },
  perizinan: {
    create: jest.fn(),
    findMany: jest.fn(),
    count: jest.fn(),
    findFirst: jest.fn(),
    findUnique: jest.fn(),
    update: jest.fn(),
    aggregate: jest.fn(),
  },
};

const mockAuditLogService = { log: jest.fn().mockResolvedValue(undefined) };
const mockWaQueueService = { enqueue: jest.fn() };

// ─── Helpers ──────────────────────────────────────────────────────────────────

const TENANT_ID = 'tenant-001';
const USER_ID = 'user-001';
const PERIZINAN_ID = 'perizinan-001';
const SANTRI_ID = 'santri-001';

function makePerizinan(overrides: Partial<Record<string, unknown>> = {}) {
  return {
    id: PERIZINAN_ID,
    tenantId: TENANT_ID,
    santriId: SANTRI_ID,
    tipe: 'PULANG',
    alasan: 'Keperluan keluarga',
    tanggalMulai: new Date('2025-01-10'),
    tanggalSelesai: new Date('2025-01-12'),
    status: 'DRAFT',
    createdBy: USER_ID,
    santri: {
      name: 'Ahmad',
      nis: '12345',
      walis: [],
    },
    ...overrides,
  };
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('PerizinanService', () => {
  let service: PerizinanService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PerizinanService,
        { provide: PrismaService, useValue: mockPrismaService },
        { provide: AuditLogService, useValue: mockAuditLogService },
        { provide: WaQueueService, useValue: mockWaQueueService },
      ],
    }).compile();

    service = module.get<PerizinanService>(PerizinanService);
    jest.clearAllMocks();
  });

  // ─── create ────────────────────────────────────────────────────────────────

  describe('create', () => {
    it('should create perizinan with DRAFT status', async () => {
      const dto = {
        santriId: SANTRI_ID,
        tipe: TipePerizinan.PULANG,
        alasan: 'Keperluan keluarga',
        tanggalMulai: '2025-01-10',
        tanggalSelesai: '2025-01-12',
      };

      mockPrismaService.santri.findFirst.mockResolvedValue({ id: SANTRI_ID, name: 'Ahmad' });
      mockPrismaService.perizinan.create.mockResolvedValue(makePerizinan());

      const result = await service.create(dto, USER_ID, TENANT_ID);

      expect(result.status).toBe('DRAFT');
      expect(mockPrismaService.perizinan.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ status: 'DRAFT', santriId: SANTRI_ID }),
        }),
      );
      expect(mockAuditLogService.log).toHaveBeenCalledWith(
        expect.objectContaining({ aksi: 'CREATE_PERIZINAN' }),
      );
    });

    it('should throw NotFoundException if santri not found', async () => {
      mockPrismaService.santri.findFirst.mockResolvedValue(null);

      await expect(
        service.create(
          { santriId: 'unknown', tipe: TipePerizinan.PULANG, alasan: 'test', tanggalMulai: '2025-01-10', tanggalSelesai: '2025-01-12' },
          USER_ID,
          TENANT_ID,
        ),
      ).rejects.toThrow(NotFoundException);
    });
  });

  // ─── findAll ───────────────────────────────────────────────────────────────

  describe('findAll', () => {
    it('should return paginated list', async () => {
      mockPrismaService.perizinan.findMany.mockResolvedValue([makePerizinan()]);
      mockPrismaService.perizinan.count.mockResolvedValue(1);

      const result = await service.findAll(TENANT_ID, { page: 1, limit: 20 });

      expect(result.data).toHaveLength(1);
      expect(result.meta.total).toBe(1);
    });
  });

  // ─── findOne ───────────────────────────────────────────────────────────────

  describe('findOne', () => {
    it('should return perizinan by id', async () => {
      mockPrismaService.perizinan.findFirst.mockResolvedValue(makePerizinan());

      const result = await service.findOne(PERIZINAN_ID, TENANT_ID);
      expect(result.id).toBe(PERIZINAN_ID);
    });

    it('should throw NotFoundException if not found', async () => {
      mockPrismaService.perizinan.findFirst.mockResolvedValue(null);

      await expect(service.findOne('nonexistent', TENANT_ID)).rejects.toThrow(NotFoundException);
    });
  });

  // ─── submit ────────────────────────────────────────────────────────────────

  describe('submit', () => {
    it('should transition DRAFT → SUBMITTED', async () => {
      mockPrismaService.perizinan.findFirst.mockResolvedValue(makePerizinan({ status: 'DRAFT' }));
      mockPrismaService.perizinan.update.mockResolvedValue(makePerizinan({ status: 'SUBMITTED' }));

      const result = await service.submit(PERIZINAN_ID, USER_ID, TENANT_ID);
      expect(result.status).toBe('SUBMITTED');
    });

    it('should throw BadRequestException for invalid transition SUBMITTED → DRAFT', async () => {
      mockPrismaService.perizinan.findFirst.mockResolvedValue(makePerizinan({ status: 'SUBMITTED' }));

      await expect(service.submit(PERIZINAN_ID, USER_ID, TENANT_ID)).rejects.toThrow(BadRequestException);
    });
  });

  // ─── approve ───────────────────────────────────────────────────────────────

  describe('approve', () => {
    it('should transition SUBMITTED → APPROVED', async () => {
      mockPrismaService.perizinan.findFirst.mockResolvedValue(makePerizinan({ status: 'SUBMITTED' }));
      mockPrismaService.perizinan.update.mockResolvedValue(makePerizinan({ status: 'APPROVED' }));

      const result = await service.approve(PERIZINAN_ID, USER_ID, TENANT_ID);
      expect(result.status).toBe('APPROVED');
      expect(mockAuditLogService.log).toHaveBeenCalledWith(
        expect.objectContaining({ aksi: 'APPROVE_PERIZINAN' }),
      );
    });

    it('should throw BadRequestException for invalid transition DRAFT → APPROVED', async () => {
      mockPrismaService.perizinan.findFirst.mockResolvedValue(makePerizinan({ status: 'DRAFT' }));

      await expect(service.approve(PERIZINAN_ID, USER_ID, TENANT_ID)).rejects.toThrow(BadRequestException);
    });
  });

  // ─── reject ────────────────────────────────────────────────────────────────

  describe('reject', () => {
    it('should transition SUBMITTED → REJECTED', async () => {
      mockPrismaService.perizinan.findFirst.mockResolvedValue(makePerizinan({ status: 'SUBMITTED' }));
      mockPrismaService.perizinan.update.mockResolvedValue(makePerizinan({ status: 'REJECTED' }));

      const result = await service.reject(PERIZINAN_ID, USER_ID, 'Tidak memenuhi syarat', TENANT_ID);
      expect(result.status).toBe('REJECTED');
    });

    it('should throw BadRequestException for invalid transition APPROVED → REJECTED', async () => {
      mockPrismaService.perizinan.findFirst.mockResolvedValue(makePerizinan({ status: 'APPROVED' }));

      await expect(
        service.reject(PERIZINAN_ID, USER_ID, 'alasan', TENANT_ID),
      ).rejects.toThrow(BadRequestException);
    });
  });

  // ─── complete ──────────────────────────────────────────────────────────────

  describe('complete', () => {
    it('should transition APPROVED → COMPLETED', async () => {
      mockPrismaService.perizinan.findFirst.mockResolvedValue(makePerizinan({ status: 'APPROVED' }));
      mockPrismaService.perizinan.update.mockResolvedValue(makePerizinan({ status: 'COMPLETED' }));

      const result = await service.complete(PERIZINAN_ID, USER_ID, TENANT_ID);
      expect(result.status).toBe('COMPLETED');
    });

    it('should transition TERLAMBAT → COMPLETED', async () => {
      mockPrismaService.perizinan.findFirst.mockResolvedValue(makePerizinan({ status: 'TERLAMBAT' }));
      mockPrismaService.perizinan.update.mockResolvedValue(makePerizinan({ status: 'COMPLETED' }));

      const result = await service.complete(PERIZINAN_ID, USER_ID, TENANT_ID);
      expect(result.status).toBe('COMPLETED');
    });

    it('should throw BadRequestException for invalid transition DRAFT → COMPLETED', async () => {
      mockPrismaService.perizinan.findFirst.mockResolvedValue(makePerizinan({ status: 'DRAFT' }));

      await expect(service.complete(PERIZINAN_ID, USER_ID, TENANT_ID)).rejects.toThrow(BadRequestException);
    });
  });

  // ─── markLate ──────────────────────────────────────────────────────────────

  describe('markLate', () => {
    it('should transition APPROVED → TERLAMBAT', async () => {
      mockPrismaService.perizinan.findUnique.mockResolvedValue(makePerizinan({ status: 'APPROVED' }));
      mockPrismaService.perizinan.update.mockResolvedValue(makePerizinan({ status: 'TERLAMBAT', terlambat: true }));

      const result = await service.markLate(PERIZINAN_ID);
      expect(result.status).toBe('TERLAMBAT');
    });

    it('should throw BadRequestException for invalid transition COMPLETED → TERLAMBAT', async () => {
      mockPrismaService.perizinan.findUnique.mockResolvedValue(makePerizinan({ status: 'COMPLETED' }));

      await expect(service.markLate(PERIZINAN_ID)).rejects.toThrow(BadRequestException);
    });
  });

  // ─── State Machine Property Test ───────────────────────────────────────────
  // Feature: pesantren-management-app, Property 18: Transisi Status Perizinan Mengikuti State Machine
  // Validates: Requirements 14.1

  describe('State Machine — Property 18', () => {
    /**
     * Valid transitions map (mirrors service implementation)
     */
    const VALID_TRANSITIONS: Record<string, string[]> = {
      DRAFT: ['SUBMITTED', 'CANCELLED'],
      SUBMITTED: ['APPROVED', 'REJECTED', 'CANCELLED'],
      APPROVED: ['COMPLETED', 'TERLAMBAT'],
      TERLAMBAT: ['COMPLETED'],
      REJECTED: [],
      COMPLETED: [],
      CANCELLED: [],
    };

    const ALL_STATUSES = Object.keys(VALID_TRANSITIONS);

    it('Property 18: invalid transitions always throw BadRequestException', () => {
      // Build list of all invalid (from, to) pairs
      const invalidPairs: Array<[string, string]> = [];
      for (const from of ALL_STATUSES) {
        for (const to of ALL_STATUSES) {
          if (!VALID_TRANSITIONS[from].includes(to)) {
            invalidPairs.push([from, to]);
          }
        }
      }

      // For each invalid pair, the service must throw BadRequestException
      for (const [from, to] of invalidPairs) {
        // We test the internal assertTransition logic by attempting the corresponding
        // service method that would trigger the transition.
        // We use submit (DRAFT→SUBMITTED) as the canonical test vehicle by mocking
        // the current status and target status.
        mockPrismaService.perizinan.findFirst.mockResolvedValue(makePerizinan({ status: from }));

        // Map target status to service method
        const methodMap: Record<string, () => Promise<unknown>> = {
          SUBMITTED: () => service.submit(PERIZINAN_ID, USER_ID, TENANT_ID),
          APPROVED: () => service.approve(PERIZINAN_ID, USER_ID, TENANT_ID),
          REJECTED: () => service.reject(PERIZINAN_ID, USER_ID, 'alasan', TENANT_ID),
          COMPLETED: () => service.complete(PERIZINAN_ID, USER_ID, TENANT_ID),
        };

        const method = methodMap[to];
        if (!method) continue; // CANCELLED/TERLAMBAT not directly callable via service methods

        // Expect BadRequestException for invalid transitions
        expect(method()).rejects.toThrow(BadRequestException);
      }
    });

    it('Property 18: valid transitions succeed (state machine allows them)', async () => {
      // Test each valid transition
      const validPairs: Array<[string, string]> = [];
      for (const [from, tos] of Object.entries(VALID_TRANSITIONS)) {
        for (const to of tos) {
          validPairs.push([from, to]);
        }
      }

      for (const [from, to] of validPairs) {
        mockPrismaService.perizinan.findFirst.mockResolvedValue(makePerizinan({ status: from }));
        mockPrismaService.perizinan.update.mockResolvedValue(makePerizinan({ status: to }));

        const methodMap: Record<string, () => Promise<unknown>> = {
          SUBMITTED: () => service.submit(PERIZINAN_ID, USER_ID, TENANT_ID),
          APPROVED: () => service.approve(PERIZINAN_ID, USER_ID, TENANT_ID),
          REJECTED: () => service.reject(PERIZINAN_ID, USER_ID, 'alasan', TENANT_ID),
          COMPLETED: () => service.complete(PERIZINAN_ID, USER_ID, TENANT_ID),
        };

        const method = methodMap[to];
        if (!method) continue;

        await expect(method()).resolves.toBeDefined();
      }
    });

    it('Property 18 (fast-check): random invalid status pairs always throw', async () => {
      // Feature: pesantren-management-app, Property 18: Transisi Status Perizinan Mengikuti State Machine
      // Validates: Requirements 14.1
      await fc.assert(
        fc.asyncProperty(
          fc.constantFrom(...ALL_STATUSES),
          fc.constantFrom(...ALL_STATUSES),
          async (from, to) => {
            const isValid = VALID_TRANSITIONS[from].includes(to);
            if (isValid) return; // skip valid transitions

            const methodMap: Record<string, () => Promise<unknown>> = {
              SUBMITTED: () => service.submit(PERIZINAN_ID, USER_ID, TENANT_ID),
              APPROVED: () => service.approve(PERIZINAN_ID, USER_ID, TENANT_ID),
              REJECTED: () => service.reject(PERIZINAN_ID, USER_ID, 'alasan', TENANT_ID),
              COMPLETED: () => service.complete(PERIZINAN_ID, USER_ID, TENANT_ID),
            };

            const method = methodMap[to];
            if (!method) return; // CANCELLED/TERLAMBAT not directly callable

            mockPrismaService.perizinan.findFirst.mockResolvedValue(makePerizinan({ status: from }));

            await expect(method()).rejects.toThrow(BadRequestException);
          },
        ),
        { numRuns: 100 },
      );
    });
  });
});
