// Feature: pesantren-management-app, Property 21: Audit Log Immutable
import { Test, TestingModule } from '@nestjs/testing';
import * as fc from 'fast-check';
import { AuditLogService } from './audit-log.service';
import { PrismaService } from '../../common/prisma/prisma.service';

// ─── Shared mock factory ──────────────────────────────────────────────────────

function buildMockPrisma() {
  return {
    auditLog: {
      create: jest.fn().mockResolvedValue({ id: 'audit-id-1' }),
      findMany: jest.fn().mockResolvedValue([]),
      findFirst: jest.fn().mockResolvedValue(null),
    },
  };
}

// ─── Arbitraries ─────────────────────────────────────────────────────────────

/** Arbitrary non-empty action string */
const arbAksi = fc.constantFrom(
  'LOGIN',
  'LOGOUT',
  'LOGIN_FAILED',
  'CREATE',
  'UPDATE',
  'DELETE',
  'APPROVE',
  'REJECT',
  'PAYMENT_CONFIRMED',
  'PERMISSION_CHANGED',
);

/** Arbitrary module name */
const arbModul = fc.constantFrom(
  'AUTH',
  'SANTRI',
  'PRESENSI',
  'PEMBAYARAN',
  'PERIZINAN',
  'RBAC',
  'LISENSI',
  'KOPERASI',
  'ASRAMA',
);

/** Arbitrary optional UUID */
const arbOptionalUuid = fc.option(fc.uuid(), { nil: undefined });

/** Arbitrary optional IP address */
const arbOptionalIp = fc.option(
  fc.ipV4(),
  { nil: undefined },
);

/** Arbitrary CreateAuditLogDto */
const arbCreateAuditLogDto = fc.record({
  userId: arbOptionalUuid,
  aksi: arbAksi,
  modul: arbModul,
  entitasId: arbOptionalUuid,
  entitasTipe: fc.option(fc.string({ minLength: 1, maxLength: 50 }), { nil: undefined }),
  nilaiBefore: fc.option(
    fc.record({ field: fc.string(), value: fc.string() }),
    { nil: undefined },
  ),
  nilaiAfter: fc.option(
    fc.record({ field: fc.string(), value: fc.string() }),
    { nil: undefined },
  ),
  ipAddress: arbOptionalIp,
  metadata: fc.option(
    fc.record({ extra: fc.string() }),
    { nil: undefined },
  ),
});

// ─── Test Suite ───────────────────────────────────────────────────────────────

/**
 * **Validates: Requirements 20.3**
 *
 * THE System SHALL memastikan entri audit log bersifat immutable —
 * tidak dapat diubah atau dihapus oleh pengguna manapun termasuk Super_Admin.
 *
 * Properties tested:
 * 21a — AuditLogService.log() always calls prisma.auditLog.create (INSERT only)
 * 21b — AuditLogService does NOT expose update or delete methods
 * 21c — prisma.auditLog.update is NEVER called by the service for any input
 * 21d — prisma.auditLog.delete / deleteMany is NEVER called by the service for any input
 */

// Feature: pesantren-management-app, Property 21: Audit Log Immutable
describe('AuditLogService — Property 21: Audit Log Immutable (PBT)', () => {
  let service: AuditLogService;
  let mockPrisma: ReturnType<typeof buildMockPrisma>;

  beforeEach(async () => {
    mockPrisma = buildMockPrisma();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuditLogService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get<AuditLogService>(AuditLogService);
    jest.clearAllMocks();
    mockPrisma.auditLog.create.mockResolvedValue({ id: 'audit-id-1' });
  });

  // ─── Property 21a: log() always calls prisma.auditLog.create ─────────────

  /**
   * **Validates: Requirements 20.3**
   *
   * For any valid audit log DTO, calling service.log() must always
   * result in exactly one call to prisma.auditLog.create — the INSERT path.
   * No other write operation (update, delete) should be triggered.
   */
  // Feature: pesantren-management-app, Property 21: Audit Log Immutable
  describe('Property 21a: log() always calls prisma.auditLog.create (INSERT only)', () => {
    it('should always call prisma.auditLog.create for any valid audit log entry', async () => {
      await fc.assert(
        fc.asyncProperty(arbCreateAuditLogDto, async (dto) => {
          jest.clearAllMocks();
          mockPrisma.auditLog.create.mockResolvedValue({ id: 'audit-id-1' });

          await service.log(dto);

          // Must have called create exactly once
          expect(mockPrisma.auditLog.create).toHaveBeenCalledTimes(1);

          // The create call must include the required fields
          const createCall = mockPrisma.auditLog.create.mock.calls[0][0];
          expect(createCall).toHaveProperty('data');
          expect(createCall.data).toHaveProperty('action', dto.aksi);
          expect(createCall.data).toHaveProperty('modul', dto.modul);

          // serverTimestamp must be a Date (server-side, not client-provided)
          expect(createCall.data.serverTimestamp).toBeInstanceOf(Date);
        }),
        { numRuns: 100 },
      );
    });
  });

  // ─── Property 21b: AuditLogService has no update or delete methods ────────

  /**
   * **Validates: Requirements 20.3**
   *
   * The AuditLogService class must NOT expose any method that could
   * mutate or remove an existing audit log entry. Only INSERT (log/create)
   * and READ (findAll/findOne) operations are permitted.
   */
  // Feature: pesantren-management-app, Property 21: Audit Log Immutable
  describe('Property 21b: AuditLogService does NOT expose update or delete methods', () => {
    it('should not have any update method on the service', () => {
      // Feature: pesantren-management-app, Property 21: Audit Log Immutable
      fc.assert(
        fc.property(fc.constant(service), (svc) => {
          const proto = Object.getPrototypeOf(svc);
          const methodNames = Object.getOwnPropertyNames(proto);

          // None of the method names should suggest mutation or deletion
          const forbiddenPatterns = [
            /update/i,
            /delete/i,
            /remove/i,
            /destroy/i,
            /patch/i,
            /modify/i,
            /edit/i,
            /alter/i,
            /truncate/i,
            /wipe/i,
            /clear/i,
            /purge/i,
          ];

          for (const methodName of methodNames) {
            // Skip constructor and internal NestJS/logger methods
            if (methodName === 'constructor' || methodName === 'logger') continue;

            for (const pattern of forbiddenPatterns) {
              expect(methodName).not.toMatch(pattern);
            }
          }

          return true;
        }),
        { numRuns: 100 },
      );
    });

    it('should only expose INSERT and READ operations (log, findAll, findOne)', () => {
      const proto = Object.getPrototypeOf(service);
      const publicMethods = Object.getOwnPropertyNames(proto).filter(
        (name) => name !== 'constructor' && typeof (service as any)[name] === 'function',
      );

      // Allowed methods: log (INSERT), findAll (READ), findOne (READ)
      const allowedMethods = new Set(['log', 'findAll', 'findOne']);

      for (const method of publicMethods) {
        expect(allowedMethods).toContain(method);
      }
    });
  });

  // ─── Property 21c: prisma.auditLog.update is NEVER called ────────────────

  /**
   * **Validates: Requirements 20.3**
   *
   * For any sequence of service operations (log, findAll, findOne),
   * prisma.auditLog.update must never be called. This ensures the service
   * cannot mutate existing audit log entries at the database level.
   */
  // Feature: pesantren-management-app, Property 21: Audit Log Immutable
  describe('Property 21c: prisma.auditLog.update is NEVER called by the service', () => {
    it('should never call prisma.auditLog.update for any audit log entry', async () => {
      // Add update mock to detect if it's ever called
      (mockPrisma.auditLog as any).update = jest.fn();
      (mockPrisma.auditLog as any).updateMany = jest.fn();

      await fc.assert(
        fc.asyncProperty(arbCreateAuditLogDto, async (dto) => {
          jest.clearAllMocks();
          mockPrisma.auditLog.create.mockResolvedValue({ id: 'audit-id-1' });
          (mockPrisma.auditLog as any).update = jest.fn();
          (mockPrisma.auditLog as any).updateMany = jest.fn();

          await service.log(dto);

          // update must NEVER be called
          expect((mockPrisma.auditLog as any).update).not.toHaveBeenCalled();
          expect((mockPrisma.auditLog as any).updateMany).not.toHaveBeenCalled();
        }),
        { numRuns: 100 },
      );
    });
  });

  // ─── Property 21d: prisma.auditLog.delete is NEVER called ────────────────

  /**
   * **Validates: Requirements 20.3**
   *
   * For any sequence of service operations, prisma.auditLog.delete and
   * prisma.auditLog.deleteMany must never be called. Audit log entries
   * are permanent and cannot be removed by any user including Super_Admin.
   */
  // Feature: pesantren-management-app, Property 21: Audit Log Immutable
  describe('Property 21d: prisma.auditLog.delete is NEVER called by the service', () => {
    it('should never call prisma.auditLog.delete for any audit log entry', async () => {
      (mockPrisma.auditLog as any).delete = jest.fn();
      (mockPrisma.auditLog as any).deleteMany = jest.fn();

      await fc.assert(
        fc.asyncProperty(arbCreateAuditLogDto, async (dto) => {
          jest.clearAllMocks();
          mockPrisma.auditLog.create.mockResolvedValue({ id: 'audit-id-1' });
          (mockPrisma.auditLog as any).delete = jest.fn();
          (mockPrisma.auditLog as any).deleteMany = jest.fn();

          await service.log(dto);

          // delete must NEVER be called
          expect((mockPrisma.auditLog as any).delete).not.toHaveBeenCalled();
          expect((mockPrisma.auditLog as any).deleteMany).not.toHaveBeenCalled();
        }),
        { numRuns: 100 },
      );
    });
  });

  // ─── Property 21e: log() uses server-side timestamp, never client time ────

  /**
   * **Validates: Requirements 20.3, 20.4**
   *
   * For any audit log entry, the serverTimestamp stored must be a Date
   * object generated server-side (not passed in from the DTO/client).
   * This ensures the immutability guarantee extends to the timestamp itself.
   */
  // Feature: pesantren-management-app, Property 21: Audit Log Immutable
  describe('Property 21e: serverTimestamp is always server-generated (not client-provided)', () => {
    it('should always use a server-side Date for serverTimestamp regardless of input', async () => {
      await fc.assert(
        fc.asyncProperty(arbCreateAuditLogDto, async (dto) => {
          jest.clearAllMocks();
          mockPrisma.auditLog.create.mockResolvedValue({ id: 'audit-id-1' });

          const before = new Date();
          await service.log(dto);
          const after = new Date();

          const createCall = mockPrisma.auditLog.create.mock.calls[0][0];
          const storedTimestamp: Date = createCall.data.serverTimestamp;

          // Must be a Date instance
          expect(storedTimestamp).toBeInstanceOf(Date);

          // Must be within the test execution window (server-generated)
          expect(storedTimestamp.getTime()).toBeGreaterThanOrEqual(before.getTime() - 100);
          expect(storedTimestamp.getTime()).toBeLessThanOrEqual(after.getTime() + 100);
        }),
        { numRuns: 100 },
      );
    });
  });

  // ─── Property 21f: log() never throws — audit failure is silent ──────────

  /**
   * **Validates: Requirements 20.3**
   *
   * Even when prisma.auditLog.create fails (e.g., DB error), service.log()
   * must not throw. Audit log failures must never break the main business flow.
   * This is a safety property that reinforces immutability by ensuring the
   * INSERT path is the only path and it degrades gracefully.
   */
  // Feature: pesantren-management-app, Property 21: Audit Log Immutable
  describe('Property 21f: log() never throws even when prisma.create fails', () => {
    it('should never throw for any input, even on DB error', async () => {
      await fc.assert(
        fc.asyncProperty(arbCreateAuditLogDto, async (dto) => {
          jest.clearAllMocks();
          // Simulate DB failure
          mockPrisma.auditLog.create.mockRejectedValue(new Error('DB connection lost'));

          // Must not throw — audit log failure is silent
          await expect(service.log(dto)).resolves.not.toThrow();
        }),
        { numRuns: 100 },
      );
    });
  });
});
