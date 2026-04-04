// Feature: pesantren-management-app, Property 20: Grace Period Lisensi Offline

/**
 * Validates: Requirements 19.3, 19.4
 *
 * Property 20: Grace Period Lisensi Offline
 *
 * For ALL combinations of lastVerifiedAt timestamps and gracePeriodDays values:
 * (a) If the time elapsed since lastVerifiedAt is <= gracePeriodDays, the system
 *     MUST allow full operation (status = GRACE_PERIOD, isReadOnly = false).
 * (b) If the time elapsed since lastVerifiedAt is > gracePeriodDays, the system
 *     MUST restrict to read-only mode (status = EXPIRED, isReadOnly = true).
 * (c) If lastVerifiedAt is null (never verified online), the system MUST treat
 *     the license as EXPIRED immediately (isReadOnly = true).
 */

import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import * as fc from 'fast-check';
import { LicenseService } from './license.service';
import { PrismaService } from '../../common/prisma/prisma.service';
import { AuditLogService } from '../audit-log/audit-log.service';

// ─── Helpers ─────────────────────────────────────────────────────────────────

/** Returns a Date that is `daysAgo` days before now */
function daysAgo(daysAgo: number): Date {
  return new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000);
}

// ─── Arbitraries ─────────────────────────────────────────────────────────────

/** Grace period days: realistic range 1–90 */
const gracePeriodDaysArb = fc.integer({ min: 1, max: 90 });

/**
 * Days elapsed since last verification: 0–120 days.
 * We use a float to capture sub-day precision edge cases.
 */
const daysElapsedArb = fc.float({ min: 0, max: 120, noNaN: true });

// ─── Mock factories ───────────────────────────────────────────────────────────

function buildLicenseRecord(overrides: Partial<{
  lastVerifiedAt: Date | null;
  gracePeriodDays: number;
  status: string;
}> = {}) {
  return {
    id: 'license-uuid-001',
    licenseKey: 'TEST-LICENSE-KEY',
    hardwareFingerprint: 'mock-fingerprint',
    activatedAt: new Date('2024-01-01T00:00:00Z'),
    lastVerifiedAt: overrides.lastVerifiedAt ?? new Date(),
    gracePeriodDays: overrides.gracePeriodDays ?? 30,
    status: overrides.status ?? 'ACTIVE',
    metadata: {},
    createdAt: new Date('2024-01-01T00:00:00Z'),
  };
}

// ─── Test Suite ───────────────────────────────────────────────────────────────

describe('Property 20: Grace Period Lisensi Offline', () => {
  let service: LicenseService;

  const mockPrisma = {
    license: {
      findFirst: jest.fn(),
      update: jest.fn(),
      create: jest.fn(),
    },
  };

  const mockAuditLog = {
    log: jest.fn().mockResolvedValue(undefined),
  };

  // HttpService always throws (simulates offline — no internet)
  const mockHttpService = {
    post: jest.fn().mockImplementation(() => {
      throw new Error('Network unreachable');
    }),
  };

  // No LICENSE_SERVER_URL configured → forces offline path
  const mockConfigService = {
    get: jest.fn().mockReturnValue(undefined),
  };

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        LicenseService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: AuditLogService, useValue: mockAuditLog },
        { provide: HttpService, useValue: mockHttpService },
        { provide: ConfigService, useValue: mockConfigService },
      ],
    }).compile();

    service = module.get<LicenseService>(LicenseService);
  });

  beforeEach(() => {
    // resetAllMocks clears both call history AND implementations,
    // preventing mockImplementation leakage between tests.
    jest.resetAllMocks();
    mockAuditLog.log.mockResolvedValue(undefined);
  });

  // ─── Property 20a: Within grace period → GRACE_PERIOD, not read-only ────────

  describe('Property 20a: Dalam grace period → status GRACE_PERIOD, isReadOnly = false', () => {
    it('should always return GRACE_PERIOD and isReadOnly=false when elapsed days <= gracePeriodDays', async () => {
      // Feature: pesantren-management-app, Property 20: Grace Period Lisensi Offline
      await fc.assert(
        fc.asyncProperty(
          gracePeriodDaysArb,
          daysElapsedArb,
          async (graceDays, elapsed) => {
            // Only test the "within grace period" case
            fc.pre(elapsed <= graceDays);

            const lastVerified = daysAgo(elapsed);
            const licenseRecord = buildLicenseRecord({
              lastVerifiedAt: lastVerified,
              gracePeriodDays: graceDays,
              status: 'ACTIVE',
            });

            mockPrisma.license.findFirst.mockResolvedValue(licenseRecord as any);
            mockPrisma.license.update.mockImplementation(({ data }: any) =>
              Promise.resolve({ ...licenseRecord, ...data }),
            );

            const result = await service.verifyLicense();

            // Within grace period: must allow full operation
            expect(result.status).toBe('GRACE_PERIOD');
            expect(result.isReadOnly).toBe(false);
          },
        ),
        { numRuns: 100 },
      );
    });

    it('should always have daysRemaining > 0 when within grace period', async () => {
      // Feature: pesantren-management-app, Property 20: Grace Period Lisensi Offline
      await fc.assert(
        fc.asyncProperty(
          gracePeriodDaysArb,
          daysElapsedArb,
          async (graceDays, elapsed) => {
            fc.pre(elapsed < graceDays); // strictly less to ensure > 0 remaining

            const lastVerified = daysAgo(elapsed);
            const licenseRecord = buildLicenseRecord({
              lastVerifiedAt: lastVerified,
              gracePeriodDays: graceDays,
              status: 'ACTIVE',
            });

            mockPrisma.license.findFirst.mockResolvedValue(licenseRecord as any);
            mockPrisma.license.update.mockImplementation(({ data }: any) =>
              Promise.resolve({ ...licenseRecord, ...data }),
            );

            const result = await service.verifyLicense();

            expect(result.status).toBe('GRACE_PERIOD');
            expect(result.daysRemaining).not.toBeNull();
            expect(result.daysRemaining!).toBeGreaterThan(0);
          },
        ),
        { numRuns: 100 },
      );
    });
  });

  // ─── Property 20b: Grace period expired → EXPIRED, isReadOnly = true ────────

  describe('Property 20b: Grace period habis → status EXPIRED, isReadOnly = true', () => {
    it('should always return EXPIRED and isReadOnly=true when elapsed days > gracePeriodDays', async () => {
      // Feature: pesantren-management-app, Property 20: Grace Period Lisensi Offline
      await fc.assert(
        fc.asyncProperty(
          gracePeriodDaysArb,
          daysElapsedArb,
          async (graceDays, elapsed) => {
            // Only test the "grace period expired" case
            fc.pre(elapsed > graceDays);

            const lastVerified = daysAgo(elapsed);
            const licenseRecord = buildLicenseRecord({
              lastVerifiedAt: lastVerified,
              gracePeriodDays: graceDays,
              status: 'ACTIVE',
            });

            mockPrisma.license.findFirst.mockResolvedValue(licenseRecord as any);
            mockPrisma.license.update.mockImplementation(({ data }: any) =>
              Promise.resolve({ ...licenseRecord, ...data }),
            );

            const result = await service.verifyLicense();

            // Grace period expired: must restrict to read-only
            expect(result.status).toBe('EXPIRED');
            expect(result.isReadOnly).toBe(true);
          },
        ),
        { numRuns: 100 },
      );
    });

    it('should persist EXPIRED status to database when grace period is exceeded', async () => {
      // Feature: pesantren-management-app, Property 20: Grace Period Lisensi Offline
      await fc.assert(
        fc.asyncProperty(
          gracePeriodDaysArb,
          daysElapsedArb,
          async (graceDays, elapsed) => {
            fc.pre(elapsed > graceDays);

            const lastVerified = daysAgo(elapsed);
            const licenseRecord = buildLicenseRecord({
              lastVerifiedAt: lastVerified,
              gracePeriodDays: graceDays,
              status: 'ACTIVE',
            });

            mockPrisma.license.findFirst.mockResolvedValue(licenseRecord as any);
            mockPrisma.license.update.mockImplementation(({ data }: any) =>
              Promise.resolve({ ...licenseRecord, ...data }),
            );

            await service.verifyLicense();

            // Must persist the EXPIRED status to DB
            expect(mockPrisma.license.update).toHaveBeenCalledWith(
              expect.objectContaining({
                data: expect.objectContaining({ status: 'EXPIRED' }),
              }),
            );
          },
        ),
        { numRuns: 100 },
      );
    });
  });

  // ─── Property 20c: Never verified online → EXPIRED immediately ──────────────

  describe('Property 20c: Belum pernah verifikasi online → EXPIRED langsung', () => {
    it('should always return EXPIRED and isReadOnly=true when lastVerifiedAt is null', async () => {
      // Feature: pesantren-management-app, Property 20: Grace Period Lisensi Offline
      await fc.assert(
        fc.asyncProperty(
          gracePeriodDaysArb,
          async (graceDays) => {
            const licenseRecord = buildLicenseRecord({
              lastVerifiedAt: null,
              gracePeriodDays: graceDays,
              status: 'ACTIVE',
            });

            // Explicitly set update to return the record with EXPIRED status
            // (simulates DB persisting the status change)
            mockPrisma.license.findFirst.mockResolvedValue(licenseRecord);
            mockPrisma.license.update.mockResolvedValue({
              ...licenseRecord,
              status: 'EXPIRED',
            });

            const result = await service.verifyLicense();

            expect(result.status).toBe('EXPIRED');
            expect(result.isReadOnly).toBe(true);
          },
        ),
        { numRuns: 100 },
      );
    });
  });

  // ─── Property 20d: isReadOnly() helper is consistent with verifyLicense() ───

  describe('Property 20d: isReadOnly() konsisten dengan status lisensi', () => {
    it('should return true from isReadOnly() when license status is EXPIRED', async () => {
      // Feature: pesantren-management-app, Property 20: Grace Period Lisensi Offline
      await fc.assert(
        fc.asyncProperty(
          gracePeriodDaysArb,
          daysElapsedArb,
          async (graceDays, elapsed) => {
            fc.pre(elapsed > graceDays);

            const lastVerified = daysAgo(elapsed);
            // Simulate a license already marked EXPIRED in DB
            const licenseRecord = buildLicenseRecord({
              lastVerifiedAt: lastVerified,
              gracePeriodDays: graceDays,
              status: 'EXPIRED',
            });

            mockPrisma.license.findFirst.mockResolvedValue(licenseRecord as any);

            const readOnly = await service.isReadOnly();
            expect(readOnly).toBe(true);
          },
        ),
        { numRuns: 100 },
      );
    });

    it('should return false from isReadOnly() when license status is ACTIVE', async () => {
      // Feature: pesantren-management-app, Property 20: Grace Period Lisensi Offline
      await fc.assert(
        fc.asyncProperty(
          gracePeriodDaysArb,
          async (graceDays) => {
            const licenseRecord = buildLicenseRecord({
              lastVerifiedAt: daysAgo(0),
              gracePeriodDays: graceDays,
              status: 'ACTIVE',
            });

            mockPrisma.license.findFirst.mockResolvedValue(licenseRecord as any);

            const readOnly = await service.isReadOnly();
            expect(readOnly).toBe(false);
          },
        ),
        { numRuns: 100 },
      );
    });
  });

  // ─── Property 20e: Audit log always recorded during offline verification ────

  describe('Property 20e: Audit log selalu dicatat saat verifikasi offline', () => {
    it('should always call AuditLogService.log with LICENSE_VERIFIED_OFFLINE during grace period evaluation', async () => {
      // Feature: pesantren-management-app, Property 20: Grace Period Lisensi Offline
      await fc.assert(
        fc.asyncProperty(
          gracePeriodDaysArb,
          daysElapsedArb,
          async (graceDays, elapsed) => {
            jest.resetAllMocks();
            mockAuditLog.log.mockResolvedValue(undefined);

            const lastVerified = daysAgo(elapsed);
            const licenseRecord = buildLicenseRecord({
              lastVerifiedAt: lastVerified,
              gracePeriodDays: graceDays,
              status: 'ACTIVE',
            });

            mockPrisma.license.findFirst.mockResolvedValue(licenseRecord as any);
            mockPrisma.license.update.mockImplementation(({ data }: any) =>
              Promise.resolve({ ...licenseRecord, ...data }),
            );

            await service.verifyLicense();

            // Audit log must be called with offline verification action
            expect(mockAuditLog.log).toHaveBeenCalledWith(
              expect.objectContaining({
                aksi: 'LICENSE_VERIFIED_OFFLINE',
                modul: 'license',
              }),
            );
          },
        ),
        { numRuns: 100 },
      );
    });
  });
});
