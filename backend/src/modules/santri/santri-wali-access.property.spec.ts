// Feature: pesantren-management-app, Property 10: Wali Santri Hanya Akses Data Santri Sendiri

/**
 * Property 10: Wali Santri Hanya Akses Data Santri Sendiri
 *
 * Validates: Requirements 2.7
 *
 * For ALL combinations of wali users and santri records:
 * - A Wali_Santri user can ONLY access santri that are linked to them via santri_wali relation.
 * - Accessing any santri NOT in their list must result in ForbiddenException (403).
 * - Accessing santri IN their list must succeed.
 */

import { ForbiddenException } from '@nestjs/common';
import * as fc from 'fast-check';
import { SantriService } from './santri.service';

// ─── Mock Factories ────────────────────────────────────────────────────────────

function createMockPrisma(overrides: Partial<any> = {}) {
  return {
    santri: {
      create: jest.fn(),
      findFirst: jest.fn(),
      findMany: jest.fn(),
      update: jest.fn(),
      count: jest.fn(),
    },
    santriWali: {
      findFirst: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      count: jest.fn(),
    },
    wali: {
      create: jest.fn(),
      findFirst: jest.fn(),
    },
    auditLog: {
      create: jest.fn(),
      findMany: jest.fn(),
    },
    $transaction: jest.fn(),
    ...overrides,
  };
}

function createMockAuditLog() {
  return { log: jest.fn().mockResolvedValue(undefined) };
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function makeSantri(id: string, tenantId: string) {
  return {
    id,
    tenantId,
    nis: `NIS-${id}`,
    name: `Santri ${id}`,
    namaLengkap: `Santri ${id}`,
    namaPanggilan: null,
    gender: 'L',
    jenisKelamin: 'L',
    dob: null,
    tanggalLahir: null,
    tempatLahir: null,
    kelas: '10A',
    room: null,
    noHp: null,
    contact: null,
    address: null,
    alamat: null,
    fotoUrl: null,
    photo: null,
    tanggalMasuk: null,
    tanggalKeluar: null,
    status: 'AKTIF',
    deletedAt: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    walis: [],
    _count: { izin: 0, pelanggaran: 0, invoices: 0 },
  };
}

// ─── Arbitraries ──────────────────────────────────────────────────────────────

/** Generates a UUID-like string ID */
const arbId = fc.uuid();

/** Generates a set of unique santri IDs (1–10 items) */
const arbSantriIdSet = fc
  .uniqueArray(arbId, { minLength: 1, maxLength: 10 })
  .filter((ids) => ids.length > 0);

/**
 * Generates a scenario with:
 * - waliUserId: the user ID of the Wali_Santri
 * - linkedSantriIds: santri IDs that ARE linked to this wali
 * - unlinkedSantriIds: santri IDs that are NOT linked to this wali
 */
const arbWaliScenario = fc
  .record({
    waliUserId: arbId,
    linkedSantriIds: arbSantriIdSet,
    unlinkedSantriIds: arbSantriIdSet,
    tenantId: arbId,
  })
  .filter(
    // Ensure no overlap between linked and unlinked sets
    ({ linkedSantriIds, unlinkedSantriIds }) =>
      !linkedSantriIds.some((id) => unlinkedSantriIds.includes(id)),
  );

// ─── Property Tests ───────────────────────────────────────────────────────────

describe('Property 10: Wali Santri Hanya Akses Data Santri Sendiri', () => {
  /**
   * Property: For ALL wali users and ALL santri NOT in their linked list,
   * findOne MUST throw ForbiddenException.
   *
   * Validates: Requirements 2.7
   */
  it('should throw ForbiddenException for every santri NOT linked to the wali', async () => {
    await fc.assert(
      fc.asyncProperty(arbWaliScenario, async ({ waliUserId, linkedSantriIds, unlinkedSantriIds, tenantId }) => {
        const prisma = createMockPrisma();
        const auditLog = createMockAuditLog();
        const service = new SantriService(prisma as any, auditLog as any);

        const waliUser = { id: waliUserId, role: 'Wali_Santri' };

        for (const santriId of unlinkedSantriIds) {
          // Santri exists in DB
          prisma.santri.findFirst.mockResolvedValue(makeSantri(santriId, tenantId));
          // No link between this wali and this santri
          prisma.santriWali.findFirst.mockResolvedValue(null);

          await expect(service.findOne(santriId, tenantId, waliUser)).rejects.toThrow(
            ForbiddenException,
          );
        }
      }),
      { numRuns: 100 },
    );
  });

  /**
   * Property: For ALL wali users and ALL santri IN their linked list,
   * findOne MUST succeed and return the santri data.
   *
   * Validates: Requirements 2.7
   */
  it('should allow access for every santri linked to the wali', async () => {
    await fc.assert(
      fc.asyncProperty(arbWaliScenario, async ({ waliUserId, linkedSantriIds, tenantId }) => {
        const prisma = createMockPrisma();
        const auditLog = createMockAuditLog();
        const service = new SantriService(prisma as any, auditLog as any);

        const waliUser = { id: waliUserId, role: 'Wali_Santri' };

        for (const santriId of linkedSantriIds) {
          const santri = makeSantri(santriId, tenantId);
          // Santri exists in DB
          prisma.santri.findFirst.mockResolvedValue(santri);
          // Link exists between this wali and this santri
          prisma.santriWali.findFirst.mockResolvedValue({
            santriId,
            waliId: `wali-${waliUserId}`,
          });

          const result = await service.findOne(santriId, tenantId, waliUser);
          expect(result).toEqual(santri);
        }
      }),
      { numRuns: 100 },
    );
  });

  /**
   * Property: For ALL wali users, findAll MUST always include the wali filter
   * so that only their linked santri are returned — never all santri.
   *
   * Validates: Requirements 2.7
   */
  it('should always apply wali filter in findAll for Wali_Santri role', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({ waliUserId: arbId, tenantId: arbId }),
        async ({ waliUserId, tenantId }) => {
          const prisma = createMockPrisma();
          const auditLog = createMockAuditLog();
          const service = new SantriService(prisma as any, auditLog as any);

          prisma.santri.findMany.mockResolvedValue([]);
          prisma.santri.count.mockResolvedValue(0);

          const waliUser = { id: waliUserId, role: 'Wali_Santri' };
          await service.findAll(tenantId, {}, waliUser);

          // The query MUST include the wali filter — never return all santri
          expect(prisma.santri.findMany).toHaveBeenCalledWith(
            expect.objectContaining({
              where: expect.objectContaining({
                walis: { some: { wali: { userId: waliUserId } } },
              }),
            }),
          );
        },
      ),
      { numRuns: 100 },
    );
  });

  /**
   * Property: For ALL non-Wali_Santri roles, findAll MUST NOT apply the wali filter,
   * ensuring admins can see all santri.
   *
   * Validates: Requirements 2.7 (by contrast — other roles are unrestricted)
   */
  it('should NOT apply wali filter in findAll for non-Wali_Santri roles', async () => {
    const nonWaliRoles = ['Admin_Pesantren', 'Super_Admin', 'Wali_Kelas', 'Owner'];

    await fc.assert(
      fc.asyncProperty(
        fc.record({
          userId: arbId,
          tenantId: arbId,
          role: fc.constantFrom(...nonWaliRoles),
        }),
        async ({ userId, tenantId, role }) => {
          const prisma = createMockPrisma();
          const auditLog = createMockAuditLog();
          const service = new SantriService(prisma as any, auditLog as any);

          prisma.santri.findMany.mockResolvedValue([]);
          prisma.santri.count.mockResolvedValue(0);

          const requestingUser = { id: userId, role };
          await service.findAll(tenantId, {}, requestingUser);

          const callArgs = prisma.santri.findMany.mock.calls[0][0];
          // The wali restriction must NOT be present for non-wali roles
          expect(callArgs.where).not.toHaveProperty('walis', {
            some: { wali: { userId } },
          });
        },
      ),
      { numRuns: 100 },
    );
  });

  /**
   * Property: For ALL wali users, accessing a santri from a DIFFERENT tenant
   * (even if linked in their own tenant) must not succeed — tenantId isolation holds.
   *
   * Validates: Requirements 2.7 (combined with tenant isolation)
   */
  it('should not allow access to santri from a different tenant even if wali link exists', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          waliUserId: arbId,
          santriId: arbId,
          correctTenantId: arbId,
          wrongTenantId: arbId,
        }).filter(({ correctTenantId, wrongTenantId }) => correctTenantId !== wrongTenantId),
        async ({ waliUserId, santriId, correctTenantId, wrongTenantId }) => {
          const prisma = createMockPrisma();
          const auditLog = createMockAuditLog();
          const service = new SantriService(prisma as any, auditLog as any);

          const waliUser = { id: waliUserId, role: 'Wali_Santri' };

          // Santri does NOT exist in the wrong tenant (assertExists returns null)
          prisma.santri.findFirst.mockResolvedValue(null);

          // Accessing santri with wrong tenantId must throw (NotFoundException from assertExists)
          await expect(service.findOne(santriId, wrongTenantId, waliUser)).rejects.toThrow();
        },
      ),
      { numRuns: 100 },
    );
  });
});
