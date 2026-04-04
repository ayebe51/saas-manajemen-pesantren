// Feature: pesantren-management-app, Property 9: Perubahan Permission Role Berlaku Langsung

import { Test, TestingModule } from '@nestjs/testing';
import { Reflector } from '@nestjs/core';
import { ExecutionContext, ForbiddenException } from '@nestjs/common';
import * as fc from 'fast-check';
import { RolesGuard } from '../../common/guards/roles.guard';
import { PrismaService } from '../../common/prisma/prisma.service';
import { ROLES_KEY } from '../../common/decorators/roles.decorator';
import { IS_PUBLIC_KEY } from '../../common/decorators/public.decorator';

/**
 * Property 9: Perubahan Permission Role Berlaku Langsung
 *
 * **Validates: Requirements 2.6**
 *
 * Req 2.6: WHEN Super_Admin mengubah permission suatu peran, THE RBAC_Engine SHALL
 *          menerapkan perubahan tersebut pada semua pengguna dengan peran tersebut
 *          tanpa memerlukan re-login.
 *
 * Key design invariant (from design.md):
 *   RolesGuard verifies permissions from the DATABASE on every request — NOT from
 *   the JWT payload. Therefore, any permission change made by Super_Admin is
 *   reflected immediately on the very next request, without requiring the user to
 *   re-login or obtain a new token.
 *
 * Property:
 *   For all valid (module, role) combinations:
 *   1. Before permission change: user with role R can access endpoint requiring role R.
 *   2. Super_Admin updates the DB so role R no longer satisfies the endpoint requirement.
 *   3. On the very next request (same JWT, no re-login), RolesGuard reads from DB
 *      and denies access (403) — without any token refresh.
 *   4. The guard NEVER caches the role from the JWT payload; it always queries the DB.
 */

// ─── Constants ────────────────────────────────────────────────────────────────

const ALL_ROLES = [
  'Super_Admin',
  'Admin_Pesantren',
  'Wali_Kelas',
  'Petugas_Keuangan',
  'Petugas_Kesehatan',
  'Petugas_Asrama',
  'Santri',
  'Wali_Santri',
  'Owner',
] as const;

type AppRole = (typeof ALL_ROLES)[number];

const ALL_MODULES = [
  'dashboard',
  'kesantrian',
  'ppdb',
  'akademik',
  'catatan',
  'pelanggaran',
  'kesehatan',
  'kunjungan',
  'presensi',
  'points',
  'keuangan',
  'pembayaran',
  'topup',
  'koperasi',
  'perizinan',
  'asrama',
  'kepegawaian',
  'eid',
  'laporan',
] as const;

type AppModule = (typeof ALL_MODULES)[number];

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Build a mock ExecutionContext simulating an HTTP request with a user
 * whose JWT was issued before the permission change (stale JWT).
 * The user object on the request reflects the JWT payload — NOT the DB state.
 */
function buildMockContext(
  user: { id: string; role: string } | null,
  requiredRoles: string[],
  isPublic = false,
): ExecutionContext {
  const mockRequest = { user };
  const mockHandler = jest.fn();
  const mockClass = jest.fn();

  return {
    getHandler: () => mockHandler,
    getClass: () => mockClass,
    switchToHttp: () => ({
      getRequest: () => mockRequest,
    }),
  } as unknown as ExecutionContext;
}

/**
 * Build a mock Reflector that returns the given metadata values.
 */
function buildMockReflector(requiredRoles: string[], isPublic = false): Reflector {
  return {
    getAllAndOverride: jest.fn((key: string) => {
      if (key === IS_PUBLIC_KEY) return isPublic;
      if (key === ROLES_KEY) return requiredRoles;
      return undefined;
    }),
  } as unknown as Reflector;
}

/**
 * Build a mutable mock PrismaService whose DB role can be changed at runtime.
 * This simulates Super_Admin updating the role in the database.
 *
 * @param userId - the user's ID
 * @param initialRoleName - the role stored in DB before the permission change
 * @returns { mockPrisma, setDbRole } — setDbRole() simulates the DB update
 */
function buildMutableMockPrisma(
  userId: string,
  initialRoleName: string,
): { mockPrisma: Partial<PrismaService>; setDbRole: (newRole: string) => void } {
  // Mutable state representing the current DB value
  let currentDbRole = initialRoleName;

  const mockPrisma: Partial<PrismaService> = {
    user: {
      findUnique: jest.fn().mockImplementation(() =>
        Promise.resolve({
          role: currentDbRole,
          roleId: `role-id-${currentDbRole}`,
          role_ref: { name: currentDbRole },
        }),
      ),
    } as any,
  };

  const setDbRole = (newRole: string) => {
    currentDbRole = newRole;
  };

  return { mockPrisma, setDbRole };
}

/**
 * Build a static mock PrismaService that always returns the given role from DB.
 */
function buildStaticMockPrisma(userId: string, roleName: string): Partial<PrismaService> {
  return {
    user: {
      findUnique: jest.fn().mockResolvedValue({
        role: roleName,
        roleId: `role-id-${roleName}`,
        role_ref: { name: roleName },
      }),
    } as any,
  };
}

// ─── Test Suite ───────────────────────────────────────────────────────────────

describe('RolesGuard — Property 9: Perubahan Permission Role Berlaku Langsung (PBT)', () => {
  // ─── Arbitraries ────────────────────────────────────────────────────────────

  /** Arbitrary: one of the 9 defined application roles (excluding Super_Admin) */
  const arbNonSuperAdminRole = fc.constantFrom(
    ...ALL_ROLES.filter((r) => r !== 'Super_Admin'),
  );

  /** Arbitrary: one of the 19 application modules */
  const arbModule = fc.constantFrom(...ALL_MODULES);

  /** Arbitrary: a user ID (UUID-like) */
  const arbUserId = fc.uuid();

  /**
   * Arbitrary: a pair of DIFFERENT non-Super_Admin roles.
   * Represents (originalRole, newRoleAfterChange).
   * After Super_Admin changes the DB, the endpoint now requires newRole,
   * but the user's JWT still carries originalRole.
   */
  const arbRolePair = fc
    .tuple(arbNonSuperAdminRole, arbNonSuperAdminRole)
    .filter(([a, b]) => a !== b);

  // ─── Property 9a: Permission change takes effect on next request ─────────────

  /**
   * **Validates: Requirements 2.6**
   *
   * Scenario:
   *   1. User has role R in DB. JWT payload also says role R.
   *   2. Endpoint requires role R → access is granted (canActivate = true).
   *   3. Super_Admin updates DB: user's role is changed to role S (different from R).
   *      The user's JWT is NOT refreshed (same token, no re-login).
   *   4. Endpoint still requires role R.
   *   5. On the next request (same JWT), RolesGuard reads from DB → finds role S.
   *      Role S ≠ role R → ForbiddenException (403) is thrown immediately.
   *
   * This proves the guard reads from DB on every request, not from JWT cache.
   */
  describe('Property 9a: After DB role change, next request is denied without re-login', () => {
    it('should deny access on the very next request after role is changed in DB', async () => {
      // Feature: pesantren-management-app, Property 9: Perubahan Permission Role Berlaku Langsung
      await fc.assert(
        fc.asyncProperty(
          arbRolePair,
          arbUserId,
          arbModule,
          async ([originalRole, newDbRole], userId, _module) => {
            // ── Step 1: Setup — user has originalRole in DB ──────────────────
            const { mockPrisma, setDbRole } = buildMutableMockPrisma(userId, originalRole);
            const reflector = buildMockReflector([originalRole]);
            const guard = new RolesGuard(reflector, mockPrisma as PrismaService);

            // JWT payload still says originalRole (issued before the change)
            const jwtUser = { id: userId, role: originalRole };
            const contextBefore = buildMockContext(jwtUser, [originalRole]);

            // ── Step 2: Before change — access is granted ────────────────────
            const resultBefore = await guard.canActivate(contextBefore);
            expect(resultBefore).toBe(true);

            // ── Step 3: Super_Admin updates DB (no re-login by the user) ─────
            // Simulate: Super_Admin calls PUT /rbac/roles/:id/permissions
            // The DB now returns newDbRole for this user's role
            setDbRole(newDbRole);

            // ── Step 4: Next request — same JWT (originalRole), DB has newDbRole ──
            // The endpoint still requires originalRole
            const contextAfter = buildMockContext(jwtUser, [originalRole]);

            // ── Step 5: Guard reads DB → finds newDbRole ≠ originalRole → 403 ──
            await expect(guard.canActivate(contextAfter)).rejects.toThrow(
              ForbiddenException,
            );
          },
        ),
        { numRuns: 100 },
      );
    });
  });

  // ─── Property 9b: Guard always queries DB, never uses JWT role cache ─────────

  /**
   * **Validates: Requirements 2.6**
   *
   * The JWT payload may contain a stale role (role at time of login).
   * The guard must ALWAYS query the DB for the current role — never trust
   * the role field in the JWT payload.
   *
   * Scenario:
   *   - JWT payload says role = "Admin_Pesantren" (issued at login time)
   *   - DB currently has role = "Wali_Kelas" (changed by Super_Admin after login)
   *   - Endpoint requires "Admin_Pesantren"
   *   - Guard must read DB → find "Wali_Kelas" → deny (403)
   *   - If guard had used JWT payload, it would incorrectly allow access
   */
  describe('Property 9b: Guard reads role from DB, not from JWT payload', () => {
    it('should use DB role (not JWT payload role) for access decision', async () => {
      // Feature: pesantren-management-app, Property 9: Perubahan Permission Role Berlaku Langsung
      await fc.assert(
        fc.asyncProperty(
          arbRolePair,
          arbUserId,
          async ([jwtRole, dbRole], userId) => {
            // DB has a DIFFERENT role than what the JWT says
            // jwtRole = stale role from JWT payload (issued before Super_Admin changed it)
            // dbRole  = current role in DB (after Super_Admin's change)
            const mockPrisma = buildStaticMockPrisma(userId, dbRole);

            // Endpoint requires the JWT role (what the user had at login time)
            const reflector = buildMockReflector([jwtRole]);
            const guard = new RolesGuard(reflector, mockPrisma as PrismaService);

            // Request carries the old JWT (jwtRole in payload), but DB has dbRole
            const context = buildMockContext({ id: userId, role: jwtRole }, [jwtRole]);

            // Guard must read DB → finds dbRole ≠ jwtRole → deny (403)
            // If guard had used JWT payload (jwtRole), it would return true (WRONG)
            await expect(guard.canActivate(context)).rejects.toThrow(ForbiddenException);

            // Verify the DB was actually queried (not short-circuited by JWT payload)
            expect(
              (mockPrisma.user!.findUnique as jest.Mock).mock.calls.length,
            ).toBeGreaterThan(0);
          },
        ),
        { numRuns: 100 },
      );
    });
  });

  // ─── Property 9c: DB query happens on every request ─────────────────────────

  /**
   * **Validates: Requirements 2.6**
   *
   * The guard must call prisma.user.findUnique on EVERY request to a protected
   * endpoint. There must be no in-memory caching of the role between requests.
   *
   * This ensures that a permission change by Super_Admin is picked up on the
   * very next request — not after some cache TTL expires.
   */
  describe('Property 9c: DB is queried on every request (no in-memory role cache)', () => {
    it('should call prisma.user.findUnique on every canActivate invocation', async () => {
      // Feature: pesantren-management-app, Property 9: Perubahan Permission Role Berlaku Langsung
      await fc.assert(
        fc.asyncProperty(
          arbNonSuperAdminRole,
          arbUserId,
          fc.integer({ min: 2, max: 10 }), // number of consecutive requests
          async (role, userId, requestCount) => {
            const mockPrisma = buildStaticMockPrisma(userId, role);
            const reflector = buildMockReflector([role]);
            const guard = new RolesGuard(reflector, mockPrisma as PrismaService);

            const jwtUser = { id: userId, role };

            // Simulate N consecutive requests with the same JWT (no re-login)
            for (let i = 0; i < requestCount; i++) {
              const context = buildMockContext(jwtUser, [role]);
              await guard.canActivate(context);
            }

            // DB must have been queried once per request — no caching
            expect(
              (mockPrisma.user!.findUnique as jest.Mock).mock.calls.length,
            ).toBe(requestCount);
          },
        ),
        { numRuns: 100 },
      );
    });
  });

  // ─── Property 9d: Permission revocation is immediate (no grace period) ───────

  /**
   * **Validates: Requirements 2.6**
   *
   * After Super_Admin revokes a role (changes DB), the VERY FIRST subsequent
   * request must be denied. There is no grace period, no delay, no TTL.
   *
   * Scenario:
   *   - User has role R. Makes request N → allowed.
   *   - Super_Admin changes DB: user now has role S.
   *   - User makes request N+1 (same JWT) → denied immediately (403).
   *   - There is no request N+2 needed; denial happens on request N+1.
   */
  describe('Property 9d: Permission revocation is immediate — denied on request N+1', () => {
    it('should deny access on the first request after permission change, not after a delay', async () => {
      // Feature: pesantren-management-app, Property 9: Perubahan Permission Role Berlaku Langsung
      await fc.assert(
        fc.asyncProperty(
          arbRolePair,
          arbUserId,
          async ([originalRole, revokedToRole], userId) => {
            const { mockPrisma, setDbRole } = buildMutableMockPrisma(userId, originalRole);
            const reflector = buildMockReflector([originalRole]);
            const guard = new RolesGuard(reflector, mockPrisma as PrismaService);

            const jwtUser = { id: userId, role: originalRole };

            // Request N: access granted (DB has originalRole)
            const contextN = buildMockContext(jwtUser, [originalRole]);
            const resultN = await guard.canActivate(contextN);
            expect(resultN).toBe(true);

            // Super_Admin changes DB — no re-login by user
            setDbRole(revokedToRole);

            // Request N+1: IMMEDIATELY denied (same JWT, DB now has revokedToRole)
            const contextN1 = buildMockContext(jwtUser, [originalRole]);
            await expect(guard.canActivate(contextN1)).rejects.toThrow(ForbiddenException);

            // Confirm: exactly 2 DB queries were made (one per request)
            expect(
              (mockPrisma.user!.findUnique as jest.Mock).mock.calls.length,
            ).toBe(2);
          },
        ),
        { numRuns: 100 },
      );
    });
  });

  // ─── Property 9e: Super_Admin is exempt from permission changes ──────────────

  /**
   * **Validates: Requirements 2.6**
   *
   * Super_Admin always has full access regardless of any permission changes.
   * Even if the DB role is changed to Super_Admin, access is always granted.
   * This is a safety invariant: Super_Admin cannot be locked out.
   */
  describe('Property 9e: Super_Admin always retains full access after any permission change', () => {
    it('should always allow Super_Admin regardless of required role or DB state', async () => {
      // Feature: pesantren-management-app, Property 9: Perubahan Permission Role Berlaku Langsung
      await fc.assert(
        fc.asyncProperty(
          fc.constantFrom(...ALL_ROLES), // any required role on the endpoint
          arbUserId,
          async (requiredRole, userId) => {
            // DB confirms user is Super_Admin
            const mockPrisma = buildStaticMockPrisma(userId, 'Super_Admin');
            const reflector = buildMockReflector([requiredRole]);
            const guard = new RolesGuard(reflector, mockPrisma as PrismaService);

            // JWT also says Super_Admin (consistent)
            const context = buildMockContext(
              { id: userId, role: 'Super_Admin' },
              [requiredRole],
            );

            const result = await guard.canActivate(context);
            expect(result).toBe(true);
          },
        ),
        { numRuns: 100 },
      );
    });
  });

  // ─── Property 9f: Multiple users with same role all affected simultaneously ──

  /**
   * **Validates: Requirements 2.6**
   *
   * "...menerapkan perubahan tersebut pada SEMUA pengguna dengan peran tersebut..."
   *
   * When Super_Admin changes a role's permission, ALL users with that role
   * are affected on their very next request — not just the first user.
   *
   * Scenario:
   *   - N users all have role R.
   *   - Super_Admin changes DB: role R is replaced by role S for all users.
   *   - Each user's next request (same JWT) must be denied (403).
   */
  describe('Property 9f: All users with the same role are affected simultaneously', () => {
    it('should deny access for all users with the changed role on their next request', async () => {
      // Feature: pesantren-management-app, Property 9: Perubahan Permission Role Berlaku Langsung
      await fc.assert(
        fc.asyncProperty(
          arbRolePair,
          fc.array(fc.uuid(), { minLength: 2, maxLength: 5 }), // 2–5 users
          async ([originalRole, newDbRole], userIds) => {
            // Each user has their own mock Prisma (simulating separate DB lookups)
            // but all share the same role — and all get the same DB update
            const guards = userIds.map((userId) => {
              const { mockPrisma, setDbRole } = buildMutableMockPrisma(userId, originalRole);
              const reflector = buildMockReflector([originalRole]);
              const guard = new RolesGuard(reflector, mockPrisma as PrismaService);
              return { userId, mockPrisma, setDbRole, guard };
            });

            // Step 1: All users can access the endpoint before the change
            for (const { userId, guard } of guards) {
              const context = buildMockContext({ id: userId, role: originalRole }, [originalRole]);
              const result = await guard.canActivate(context);
              expect(result).toBe(true);
            }

            // Step 2: Super_Admin changes the DB for ALL users with this role
            for (const { setDbRole } of guards) {
              setDbRole(newDbRole);
            }

            // Step 3: ALL users are denied on their next request (same JWT)
            for (const { userId, guard } of guards) {
              const context = buildMockContext({ id: userId, role: originalRole }, [originalRole]);
              await expect(guard.canActivate(context)).rejects.toThrow(ForbiddenException);
            }
          },
        ),
        { numRuns: 100 },
      );
    });
  });
});
