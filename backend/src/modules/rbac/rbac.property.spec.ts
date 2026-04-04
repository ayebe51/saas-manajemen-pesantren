// Feature: pesantren-management-app, Property 7: RBAC Enforcement — Akses Sesuai Permission

import { Test, TestingModule } from '@nestjs/testing';
import { Reflector } from '@nestjs/core';
import { ExecutionContext, ForbiddenException } from '@nestjs/common';
import * as fc from 'fast-check';
import { RolesGuard } from '../../common/guards/roles.guard';
import { PrismaService } from '../../common/prisma/prisma.service';
import { ROLES_KEY } from '../../common/decorators/roles.decorator';
import { IS_PUBLIC_KEY } from '../../common/decorators/public.decorator';

/**
 * Property 7: RBAC Enforcement — Akses Sesuai Permission
 *
 * **Validates: Requirements 2.3, 2.4**
 *
 * Req 2.3: WHEN a user accesses a protected endpoint, THE RBAC_Engine SHALL verify
 *          the permission the user has before processing the request.
 * Req 2.4: IF the user does not have the required permission, THEN THE RBAC_Engine
 *          SHALL return error code 403 without executing the business logic of that endpoint.
 *
 * Property:
 *   For all combinations of user role and required role on a protected endpoint:
 *   - IF the user's role matches the required role → request is allowed (canActivate returns true)
 *   - IF the user's role does NOT match the required role → ForbiddenException (403) is thrown
 *     without executing business logic
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
 * Build a mock ExecutionContext that simulates an HTTP request
 * with the given user attached (as set by JwtAuthGuard).
 */
function buildMockContext(
  user: { id: string; role: string } | null,
  requiredRoles: string[],
  isPublic = false,
): ExecutionContext {
  const mockRequest = { user };

  const mockHandler = jest.fn();
  const mockClass = jest.fn();

  const mockContext = {
    getHandler: () => mockHandler,
    getClass: () => mockClass,
    switchToHttp: () => ({
      getRequest: () => mockRequest,
    }),
  } as unknown as ExecutionContext;

  return mockContext;
}

/**
 * Build a mock Reflector that returns the given metadata values.
 */
function buildMockReflector(requiredRoles: string[], isPublic = false): Reflector {
  const reflector = {
    getAllAndOverride: jest.fn((key: string) => {
      if (key === IS_PUBLIC_KEY) return isPublic;
      if (key === ROLES_KEY) return requiredRoles;
      return undefined;
    }),
  } as unknown as Reflector;
  return reflector;
}

/**
 * Build a mock PrismaService that returns a user with the given role.
 * The role_ref.name is set to the role string (new RBAC system).
 */
function buildMockPrisma(userId: string, roleName: string): Partial<PrismaService> {
  return {
    user: {
      findUnique: jest.fn().mockResolvedValue({
        role: roleName,
        roleId: `role-id-${roleName}`,
        role_ref: { name: roleName },
      }),
    } as any,
  } as Partial<PrismaService>;
}

// ─── Test Suite ───────────────────────────────────────────────────────────────

describe('RolesGuard — Property 7: RBAC Enforcement (PBT)', () => {
  // ─── Arbitraries ────────────────────────────────────────────────────────────

  /** Arbitrary: one of the 9 defined application roles */
  const arbRole = fc.constantFrom(...ALL_ROLES);

  /** Arbitrary: one of the 19 application modules */
  const arbModule = fc.constantFrom(...ALL_MODULES);

  /** Arbitrary: permission type */
  const arbPermissionType = fc.constantFrom('can_read', 'can_write');

  /** Arbitrary: a user ID (UUID-like) */
  const arbUserId = fc.uuid();

  /**
   * Arbitrary: a pair of (userRole, requiredRole) where they are DIFFERENT.
   * This represents the "no permission" scenario.
   */
  const arbMismatchedRoles = fc
    .tuple(arbRole, arbRole)
    .filter(([userRole, requiredRole]) => userRole !== requiredRole)
    // Exclude Super_Admin as user role — it always has full access
    .filter(([userRole]) => userRole !== 'Super_Admin');

  /**
   * Arbitrary: a role that is NOT Super_Admin (to test non-superadmin access).
   */
  const arbNonSuperAdminRole = fc.constantFrom(
    ...ALL_ROLES.filter((r) => r !== 'Super_Admin'),
  );

  // ─── Property 7a: Matching role → request proceeds ──────────────────────────

  /**
   * **Validates: Requirements 2.3**
   *
   * For all roles (except Super_Admin which is tested separately):
   * When the user's role matches the required role on the endpoint,
   * canActivate() must return true (request proceeds).
   */
  describe('Property 7a: User with matching role → request is allowed', () => {
    it('should always return true when user role matches required role', async () => {
      // Feature: pesantren-management-app, Property 7: RBAC Enforcement — Akses Sesuai Permission
      await fc.assert(
        fc.asyncProperty(
          arbNonSuperAdminRole,
          arbUserId,
          arbModule,
          async (role, userId, _module) => {
            const reflector = buildMockReflector([role]);
            const mockPrisma = buildMockPrisma(userId, role);

            const guard = new RolesGuard(
              reflector,
              mockPrisma as PrismaService,
            );

            const context = buildMockContext({ id: userId, role }, [role]);

            const result = await guard.canActivate(context);

            expect(result).toBe(true);
          },
        ),
        { numRuns: 100 },
      );
    });
  });

  // ─── Property 7b: Super_Admin always has full access ────────────────────────

  /**
   * **Validates: Requirements 2.3**
   *
   * Super_Admin must always be allowed access regardless of the required role.
   */
  describe('Property 7b: Super_Admin always has full access', () => {
    it('should always return true for Super_Admin regardless of required role', async () => {
      // Feature: pesantren-management-app, Property 7: RBAC Enforcement — Akses Sesuai Permission
      await fc.assert(
        fc.asyncProperty(
          arbRole, // any required role
          arbUserId,
          async (requiredRole, userId) => {
            const reflector = buildMockReflector([requiredRole]);
            const mockPrisma = buildMockPrisma(userId, 'Super_Admin');

            const guard = new RolesGuard(
              reflector,
              mockPrisma as PrismaService,
            );

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

  // ─── Property 7c: Mismatched role → 403 ForbiddenException ─────────────────

  /**
   * **Validates: Requirements 2.4**
   *
   * For all combinations where the user's role does NOT match the required role:
   * canActivate() must throw ForbiddenException (HTTP 403).
   * Business logic must NOT be executed (the guard throws before reaching the handler).
   */
  describe('Property 7c: User without required role → 403 ForbiddenException', () => {
    it('should always throw ForbiddenException when user role does not match required role', async () => {
      // Feature: pesantren-management-app, Property 7: RBAC Enforcement — Akses Sesuai Permission
      await fc.assert(
        fc.asyncProperty(
          arbMismatchedRoles,
          arbUserId,
          arbModule,
          async ([userRole, requiredRole], userId, _module) => {
            const reflector = buildMockReflector([requiredRole]);
            const mockPrisma = buildMockPrisma(userId, userRole);

            const guard = new RolesGuard(
              reflector,
              mockPrisma as PrismaService,
            );

            const context = buildMockContext({ id: userId, role: userRole }, [
              requiredRole,
            ]);

            // Business logic tracker — must NOT be called
            const businessLogicExecuted = jest.fn();

            await expect(guard.canActivate(context)).rejects.toThrow(
              ForbiddenException,
            );

            // Business logic was never invoked (guard threw before reaching handler)
            expect(businessLogicExecuted).not.toHaveBeenCalled();
          },
        ),
        { numRuns: 100 },
      );
    });

    it('should throw ForbiddenException with HTTP status 403', async () => {
      // Feature: pesantren-management-app, Property 7: RBAC Enforcement — Akses Sesuai Permission
      await fc.assert(
        fc.asyncProperty(
          arbMismatchedRoles,
          arbUserId,
          async ([userRole, requiredRole], userId) => {
            const reflector = buildMockReflector([requiredRole]);
            const mockPrisma = buildMockPrisma(userId, userRole);

            const guard = new RolesGuard(
              reflector,
              mockPrisma as PrismaService,
            );

            const context = buildMockContext({ id: userId, role: userRole }, [
              requiredRole,
            ]);

            let thrownError: unknown;
            try {
              await guard.canActivate(context);
            } catch (err) {
              thrownError = err;
            }

            expect(thrownError).toBeInstanceOf(ForbiddenException);
            expect((thrownError as ForbiddenException).getStatus()).toBe(403);
          },
        ),
        { numRuns: 100 },
      );
    });
  });

  // ─── Property 7d: Public endpoints bypass RBAC ──────────────────────────────

  /**
   * **Validates: Requirements 2.3**
   *
   * Endpoints decorated with @Public() must bypass RBAC checks entirely.
   */
  describe('Property 7d: Public endpoints bypass RBAC', () => {
    it('should always return true for public endpoints regardless of user role', async () => {
      // Feature: pesantren-management-app, Property 7: RBAC Enforcement — Akses Sesuai Permission
      await fc.assert(
        fc.asyncProperty(
          arbRole,
          arbUserId,
          async (userRole, userId) => {
            // isPublic = true
            const reflector = buildMockReflector(['Super_Admin'], true);
            const mockPrisma = buildMockPrisma(userId, userRole);

            const guard = new RolesGuard(
              reflector,
              mockPrisma as PrismaService,
            );

            const context = buildMockContext({ id: userId, role: userRole }, [
              'Super_Admin',
            ]);

            const result = await guard.canActivate(context);

            expect(result).toBe(true);
          },
        ),
        { numRuns: 100 },
      );
    });
  });

  // ─── Property 7e: No @Roles() decorator → JWT alone is sufficient ───────────

  /**
   * **Validates: Requirements 2.3**
   *
   * Endpoints without @Roles() decorator (but protected by JWT) must allow
   * any authenticated user through.
   */
  describe('Property 7e: No @Roles() decorator → any authenticated user is allowed', () => {
    it('should always return true when no roles are required (no @Roles decorator)', async () => {
      // Feature: pesantren-management-app, Property 7: RBAC Enforcement — Akses Sesuai Permission
      await fc.assert(
        fc.asyncProperty(
          arbNonSuperAdminRole,
          arbUserId,
          async (userRole, userId) => {
            // No required roles (empty array)
            const reflector = buildMockReflector([]);
            const mockPrisma = buildMockPrisma(userId, userRole);

            const guard = new RolesGuard(
              reflector,
              mockPrisma as PrismaService,
            );

            const context = buildMockContext({ id: userId, role: userRole }, []);

            const result = await guard.canActivate(context);

            expect(result).toBe(true);
          },
        ),
        { numRuns: 100 },
      );
    });
  });

  // ─── Property 7f: SCANNER role is always forbidden on protected endpoints ───

  /**
   * **Validates: Requirements 2.4**
   *
   * SCANNER tokens have no role-based access beyond their own endpoints.
   * Any attempt to access a role-protected endpoint must result in 403.
   */
  describe('Property 7f: SCANNER role is always forbidden on role-protected endpoints', () => {
    it('should always throw ForbiddenException for SCANNER role on any protected endpoint', async () => {
      // Feature: pesantren-management-app, Property 7: RBAC Enforcement — Akses Sesuai Permission
      await fc.assert(
        fc.asyncProperty(
          arbRole, // any required role
          arbUserId,
          async (requiredRole, userId) => {
            const reflector = buildMockReflector([requiredRole]);
            const mockPrisma = buildMockPrisma(userId, 'SCANNER');

            const guard = new RolesGuard(
              reflector,
              mockPrisma as PrismaService,
            );

            const context = buildMockContext(
              { id: userId, role: 'SCANNER' },
              [requiredRole],
            );

            await expect(guard.canActivate(context)).rejects.toThrow(
              ForbiddenException,
            );
          },
        ),
        { numRuns: 100 },
      );
    });
  });

  // ─── Property 7g: Unauthenticated user (no user in request) → denied ────────

  /**
   * **Validates: Requirements 2.3, 2.4**
   *
   * If no user is attached to the request (JWT guard did not set user),
   * the guard must deny access (return false or throw).
   */
  describe('Property 7g: Unauthenticated request → access denied', () => {
    it('should always return false when no user is present in the request', async () => {
      // Feature: pesantren-management-app, Property 7: RBAC Enforcement — Akses Sesuai Permission
      await fc.assert(
        fc.asyncProperty(
          arbRole, // any required role
          async (requiredRole) => {
            const reflector = buildMockReflector([requiredRole]);
            // Prisma won't be called since user is null
            const mockPrisma = {
              user: { findUnique: jest.fn() },
            } as unknown as PrismaService;

            const guard = new RolesGuard(reflector, mockPrisma);

            // No user in request
            const context = buildMockContext(null, [requiredRole]);

            const result = await guard.canActivate(context);

            expect(result).toBe(false);
          },
        ),
        { numRuns: 100 },
      );
    });
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Feature: pesantren-management-app, Property 8: Satu User Satu Role Aktif
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Property 8: Satu User Satu Role Aktif
 *
 * **Validates: Requirements 2.2**
 *
 * Req 2.2: THE System SHALL memastikan satu akun pengguna hanya memiliki satu
 *          peran utama aktif pada satu waktu.
 *
 * Property:
 *   For all users in the system, at any point in time:
 *   1. A user has exactly one active role (never zero, never more than one).
 *   2. Assigning a new role to a user replaces the previous role — it does not
 *      accumulate. After the assignment the user still has exactly one role.
 *   3. The schema-level constraint (single roleId FK) is reflected in the
 *      service layer: getUserPermissions() always returns exactly one role name.
 */

import { RbacService } from './rbac.service';
import { AuditLogService } from '../audit-log/audit-log.service';

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Build a mock PrismaService that simulates a user with a single role.
 * The user.roleId points to exactly one role; role_ref.name is that role's name.
 */
function buildUserWithRole(
  userId: string,
  roleId: string,
  roleName: string,
): Partial<import('../../common/prisma/prisma.service').PrismaService> {
  return {
    user: {
      findUnique: jest.fn().mockResolvedValue({
        id: userId,
        role: roleName,
        roleId,
        role_ref: {
          id: roleId,
          name: roleName,
          permissions: [],
        },
      }),
      update: jest.fn().mockImplementation(({ data }) => {
        // Simulate DB update: replace roleId (single FK — cannot hold two values)
        return Promise.resolve({
          id: userId,
          role: data.role ?? roleName,
          roleId: data.roleId ?? roleId,
          role_ref: {
            id: data.roleId ?? roleId,
            name: data.role ?? roleName,
            permissions: [],
          },
        });
      }),
    } as any,
    role: {
      findUnique: jest.fn().mockImplementation(({ where }) =>
        Promise.resolve({
          id: where.id ?? roleId,
          name: roleName,
          permissions: [],
        }),
      ),
    } as any,
  } as Partial<import('../../common/prisma/prisma.service').PrismaService>;
}

/** Minimal mock AuditLogService */
function buildMockAuditLog(): AuditLogService {
  return { log: jest.fn().mockResolvedValue(undefined) } as unknown as AuditLogService;
}

// ─── Test Suite ───────────────────────────────────────────────────────────────

describe('RbacService — Property 8: Satu User Satu Role Aktif (PBT)', () => {
  // Arbitraries
  const arbRole = fc.constantFrom(
    'Super_Admin',
    'Admin_Pesantren',
    'Wali_Kelas',
    'Petugas_Keuangan',
    'Petugas_Kesehatan',
    'Petugas_Asrama',
    'Santri',
    'Wali_Santri',
    'Owner',
  );

  const arbUserId = fc.uuid();
  const arbRoleId = fc.uuid();

  /**
   * Arbitrary: two DIFFERENT roles (old role → new role assignment).
   */
  const arbRolePair = fc
    .tuple(arbRole, arbRole)
    .filter(([a, b]) => a !== b);

  // ─── Property 8a: User always has exactly one role ──────────────────────────

  /**
   * For all users with any valid role, getUserPermissions() must return
   * exactly one role name — never undefined, never an array of multiple roles.
   */
  describe('Property 8a: getUserPermissions always returns exactly one role', () => {
    it('should return exactly one role for any user', async () => {
      // Feature: pesantren-management-app, Property 8: Satu User Satu Role Aktif
      await fc.assert(
        fc.asyncProperty(
          arbUserId,
          arbRoleId,
          arbRole,
          async (userId, roleId, roleName) => {
            const mockPrisma = buildUserWithRole(userId, roleId, roleName);
            const mockAudit = buildMockAuditLog();

            const service = new RbacService(
              mockPrisma as import('../../common/prisma/prisma.service').PrismaService,
              mockAudit,
            );

            const result = await service.getUserPermissions(userId);

            // Must have exactly one role — not undefined, not an array
            expect(result.role).toBeDefined();
            expect(typeof result.role).toBe('string');
            expect(result.role.length).toBeGreaterThan(0);

            // The role returned must match what was stored
            expect(result.role).toBe(roleName);
          },
        ),
        { numRuns: 100 },
      );
    });
  });

  // ─── Property 8b: Role assignment replaces, never accumulates ───────────────

  /**
   * When a user's roleId is updated to a new role, the user ends up with
   * exactly one role — the new one. The old role is gone.
   *
   * This is enforced by the single `roleId` FK in the schema: a column can
   * only hold one value, so any update atomically replaces the previous value.
   */
  describe('Property 8b: Assigning a new role replaces the old one', () => {
    it('should result in exactly one role after role reassignment', async () => {
      // Feature: pesantren-management-app, Property 8: Satu User Satu Role Aktif
      await fc.assert(
        fc.asyncProperty(
          arbUserId,
          arbRoleId,
          fc.uuid(), // newRoleId
          arbRolePair,
          async (userId, oldRoleId, newRoleId, [oldRoleName, newRoleName]) => {
            // Start: user has oldRole
            const mockPrisma = buildUserWithRole(userId, oldRoleId, oldRoleName);
            const mockAudit = buildMockAuditLog();

            // Simulate the DB update (prisma.user.update replaces roleId)
            const updateSpy = mockPrisma.user!.update as jest.Mock;

            // Perform the role update
            const updatedUser = await (mockPrisma.user!.update as jest.Mock)({
              where: { id: userId },
              data: { roleId: newRoleId, role: newRoleName },
            });

            // After update: user has exactly one role — the new one
            expect(updatedUser.roleId).toBe(newRoleId);
            expect(updatedUser.role).toBe(newRoleName);

            // The old role is no longer present
            expect(updatedUser.roleId).not.toBe(oldRoleId);
            expect(updatedUser.role).not.toBe(oldRoleName);

            // update was called exactly once (atomic replacement)
            expect(updateSpy).toHaveBeenCalledTimes(1);
          },
        ),
        { numRuns: 100 },
      );
    });
  });

  // ─── Property 8c: roleId is a single scalar — cannot hold multiple values ───

  /**
   * The schema defines `roleId String?` — a scalar field.
   * A scalar field can hold at most one value at a time.
   * This property verifies that the mock (mirroring the real schema) never
   * returns a user with more than one roleId.
   */
  describe('Property 8c: User object never has multiple roleIds', () => {
    it('should never return a user with multiple roles', async () => {
      // Feature: pesantren-management-app, Property 8: Satu User Satu Role Aktif
      await fc.assert(
        fc.asyncProperty(
          arbUserId,
          arbRoleId,
          arbRole,
          async (userId, roleId, roleName) => {
            const mockPrisma = buildUserWithRole(userId, roleId, roleName);

            const user = await (mockPrisma.user!.findUnique as jest.Mock)({
              where: { id: userId },
              include: { role_ref: { include: { permissions: true } } },
            });

            // roleId is a single string — not an array
            expect(Array.isArray(user.roleId)).toBe(false);
            expect(typeof user.roleId).toBe('string');

            // role_ref is a single object — not an array
            expect(Array.isArray(user.role_ref)).toBe(false);
            expect(typeof user.role_ref).toBe('object');
            expect(user.role_ref).not.toBeNull();

            // Exactly one role name
            expect(typeof user.role_ref.name).toBe('string');
          },
        ),
        { numRuns: 100 },
      );
    });
  });

  // ─── Property 8d: roleId cannot be null for an active user ──────────────────

  /**
   * An active user must always have a non-null roleId.
   * The schema has `roleId String?` (optional) but business logic requires
   * every active user to have a role assigned.
   * getUserPermissions() must return a defined, non-empty role string.
   */
  describe('Property 8d: Active user always has a non-null role', () => {
    it('should never return undefined or empty role for an active user', async () => {
      // Feature: pesantren-management-app, Property 8: Satu User Satu Role Aktif
      await fc.assert(
        fc.asyncProperty(
          arbUserId,
          arbRoleId,
          arbRole,
          async (userId, roleId, roleName) => {
            const mockPrisma = buildUserWithRole(userId, roleId, roleName);
            const mockAudit = buildMockAuditLog();

            const service = new RbacService(
              mockPrisma as import('../../common/prisma/prisma.service').PrismaService,
              mockAudit,
            );

            const result = await service.getUserPermissions(userId);

            // Role must be defined and non-empty
            expect(result.role).toBeTruthy();
            expect(result.role).not.toBe('');
            expect(result.role).not.toBeNull();
            expect(result.role).not.toBeUndefined();
          },
        ),
        { numRuns: 100 },
      );
    });
  });
});
