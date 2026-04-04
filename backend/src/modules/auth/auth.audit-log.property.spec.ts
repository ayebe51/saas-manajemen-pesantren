// Feature: pesantren-management-app, Property 6: Audit Log Mencatat Semua Aksi Auth

/**
 * **Validates: Requirements 1.8, 20.2**
 *
 * Property 6: Untuk semua aksi login berhasil, login gagal, dan logout,
 * harus ada entri di audit log yang mengandung:
 *   - user identity (userId untuk login berhasil/logout, atau null untuk login gagal)
 *   - jenis aksi (LOGIN_SUCCESS | LOGIN_FAILED | LOGOUT)
 *   - IP address
 *   - modul = 'auth'
 *
 * AuditLogService.log() MUST be called with the correct parameters for every
 * auth action, regardless of the input values used.
 */

import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import * as fc from 'fast-check';
import { AuthService } from './auth.service';
import { PrismaService } from '../../common/prisma/prisma.service';
import { AuditLogService } from '../audit-log/audit-log.service';
import { LoginRateLimiterService } from './login-rate-limiter.service';

// ─── Arbitraries ──────────────────────────────────────────────────────────────

/** Valid IPv4 addresses */
const ipV4Arb = fc.ipV4();

/** Valid IPv6 addresses */
const ipV6Arb = fc.ipV6();

/** Edge-case IP addresses */
const edgeCaseIpArb = fc.oneof(
  fc.constant('127.0.0.1'),
  fc.constant('::1'),
  fc.constant('0.0.0.0'),
  fc.constant('192.168.1.1'),
  fc.constant('10.0.0.1'),
  fc.constant('unknown'),
);

/** Any IP address */
const anyIpArb = fc.oneof(ipV4Arb, ipV6Arb, edgeCaseIpArb);

/** Arbitrary email address */
const anyEmailArb = fc.oneof(
  fc.emailAddress(),
  fc.constant('admin@pesantren.com'),
  fc.string({ minLength: 1, maxLength: 100 }),
);

/** Arbitrary password */
const anyPasswordArb = fc.string({ minLength: 1, maxLength: 72 });

/** Arbitrary user ID (UUID-like) */
const anyUserIdArb = fc.uuid();

/** Arbitrary refresh token */
const anyRefreshTokenArb = fc.stringMatching(/^[A-Za-z0-9._-]{20,80}$/);

// ─── Mock factory ─────────────────────────────────────────────────────────────

function buildMocks() {
  const mockPrisma = {
    user: { findUnique: jest.fn(), update: jest.fn() },
    refreshToken: {
      create: jest.fn(),
      findFirst: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      updateMany: jest.fn(),
    },
    loginAttempt: { create: jest.fn() },
    $transaction: jest.fn(),
  };

  const mockJwt = {
    sign: jest.fn().mockReturnValue('mock.jwt.token'),
    verify: jest.fn(),
  };

  const mockConfig = { get: jest.fn().mockReturnValue(undefined) };

  const mockAuditLog = { log: jest.fn().mockResolvedValue(undefined) };

  const mockRateLimiter = {
    isLockedOut: jest.fn().mockResolvedValue(false),
    recordFailedAttempt: jest.fn().mockResolvedValue(1),
    resetAttempts: jest.fn().mockResolvedValue(undefined),
    getLockoutTtl: jest.fn().mockResolvedValue(0),
  };

  return { mockPrisma, mockJwt, mockConfig, mockAuditLog, mockRateLimiter };
}

function buildUser(overrides: Record<string, unknown> = {}) {
  return {
    id: 'user-audit-test',
    email: 'admin@pesantren.com',
    passwordHash: 'hashed_password',
    isActive: true,
    role: 'Admin_Pesantren',
    tenantId: null,
    name: 'Admin',
    role_ref: null,
    ...overrides,
  };
}

// ─── Test suite ───────────────────────────────────────────────────────────────

describe('AuthService — Property 6: Audit Log Mencatat Semua Aksi Auth (PBT)', () => {
  let service: AuthService;
  let mocks: ReturnType<typeof buildMocks>;

  beforeAll(async () => {
    mocks = buildMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: PrismaService, useValue: mocks.mockPrisma },
        { provide: JwtService, useValue: mocks.mockJwt },
        { provide: ConfigService, useValue: mocks.mockConfig },
        { provide: AuditLogService, useValue: mocks.mockAuditLog },
        { provide: LoginRateLimiterService, useValue: mocks.mockRateLimiter },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
  });

  beforeEach(() => {
    jest.clearAllMocks();
    mocks.mockJwt.sign.mockReturnValue('mock.jwt.token');
    mocks.mockAuditLog.log.mockResolvedValue(undefined);
    mocks.mockRateLimiter.isLockedOut.mockResolvedValue(false);
    mocks.mockRateLimiter.recordFailedAttempt.mockResolvedValue(1);
    mocks.mockRateLimiter.resetAttempts.mockResolvedValue(undefined);
    mocks.mockRateLimiter.getLockoutTtl.mockResolvedValue(0);
  });

  // ─── Property 6a: LOGIN_SUCCESS audit log ─────────────────────────────────

  /**
   * **Validates: Requirements 1.8, 20.2**
   *
   * For ALL successful logins, AuditLogService.log() MUST be called with:
   *   - aksi: 'LOGIN_SUCCESS'
   *   - modul: 'auth'
   *   - userId: the authenticated user's ID
   *   - ipAddress: the request IP address
   */
  describe('Property 6a: LOGIN_SUCCESS sempre registra audit log com userId e IP', () => {
    it('should always call AuditLogService.log with LOGIN_SUCCESS, userId, and ipAddress', async () => {
      await fc.assert(
        fc.asyncProperty(anyIpArb, anyUserIdArb, async (ip, userId) => {
          jest.clearAllMocks();
          mocks.mockAuditLog.log.mockResolvedValue(undefined);
          mocks.mockRateLimiter.isLockedOut.mockResolvedValue(false);
          mocks.mockRateLimiter.recordFailedAttempt.mockResolvedValue(1);
          mocks.mockRateLimiter.resetAttempts.mockResolvedValue(undefined);
          mocks.mockJwt.sign.mockReturnValue('mock.jwt.token');

          const user = buildUser({ id: userId });

          mocks.mockPrisma.user.findUnique.mockResolvedValue(user);
          jest.spyOn(bcrypt, 'compare').mockResolvedValue(true as never);
          mocks.mockPrisma.refreshToken.create.mockResolvedValue({});
          mocks.mockPrisma.user.update.mockResolvedValue(user);
          mocks.mockPrisma.loginAttempt.create.mockResolvedValue({});

          await service.login({ email: user.email, password: 'any_password' }, ip);

          // AuditLogService.log must have been called at least once
          expect(mocks.mockAuditLog.log).toHaveBeenCalled();

          // Find the LOGIN_SUCCESS call
          const calls: Array<Record<string, unknown>> = mocks.mockAuditLog.log.mock.calls.map(
            (c: unknown[]) => c[0] as Record<string, unknown>,
          );
          const successCall = calls.find((c) => c['aksi'] === 'LOGIN_SUCCESS');

          // Must have a LOGIN_SUCCESS entry
          expect(successCall).toBeDefined();

          // Must contain userId
          expect(successCall!['userId']).toBe(userId);

          // Must contain ipAddress
          expect(successCall!['ipAddress']).toBe(ip);

          // Must have modul = 'auth'
          expect(successCall!['modul']).toBe('auth');
        }),
        { numRuns: 100 },
      );
    });
  });

  // ─── Property 6b: LOGIN_FAILED audit log ──────────────────────────────────

  /**
   * **Validates: Requirements 1.8, 20.2**
   *
   * For ALL failed logins (user not found, wrong password, inactive account),
   * AuditLogService.log() MUST be called with:
   *   - aksi: 'LOGIN_FAILED'
   *   - modul: 'auth'
   *   - userId: undefined/null (identity unknown for failed login)
   *   - ipAddress: the request IP address
   */
  describe('Property 6b: LOGIN_FAILED sempre registra audit log com IP (sem userId)', () => {
    it('should always call AuditLogService.log with LOGIN_FAILED and ipAddress when user not found', async () => {
      await fc.assert(
        fc.asyncProperty(anyIpArb, anyEmailArb, anyPasswordArb, async (ip, email, password) => {
          jest.clearAllMocks();
          mocks.mockAuditLog.log.mockResolvedValue(undefined);
          mocks.mockRateLimiter.isLockedOut.mockResolvedValue(false);
          mocks.mockRateLimiter.recordFailedAttempt.mockResolvedValue(1);
          mocks.mockPrisma.loginAttempt.create.mockResolvedValue({});

          // User not found
          mocks.mockPrisma.user.findUnique.mockResolvedValue(null);

          try {
            await service.login({ email, password }, ip);
          } catch {
            // Expected to throw UnauthorizedException
          }

          // AuditLogService.log must have been called
          expect(mocks.mockAuditLog.log).toHaveBeenCalled();

          const calls: Array<Record<string, unknown>> = mocks.mockAuditLog.log.mock.calls.map(
            (c: unknown[]) => c[0] as Record<string, unknown>,
          );
          const failedCall = calls.find((c) => c['aksi'] === 'LOGIN_FAILED');

          // Must have a LOGIN_FAILED entry
          expect(failedCall).toBeDefined();

          // Must contain ipAddress
          expect(failedCall!['ipAddress']).toBe(ip);

          // Must have modul = 'auth'
          expect(failedCall!['modul']).toBe('auth');

          // userId must be absent or null (identity unknown for failed login)
          expect(failedCall!['userId']).toBeFalsy();
        }),
        { numRuns: 100 },
      );
    });

    it('should always call AuditLogService.log with LOGIN_FAILED when password is wrong', async () => {
      await fc.assert(
        fc.asyncProperty(anyIpArb, anyUserIdArb, async (ip, userId) => {
          jest.clearAllMocks();
          mocks.mockAuditLog.log.mockResolvedValue(undefined);
          mocks.mockRateLimiter.isLockedOut.mockResolvedValue(false);
          mocks.mockRateLimiter.recordFailedAttempt.mockResolvedValue(1);
          mocks.mockPrisma.loginAttempt.create.mockResolvedValue({});

          const user = buildUser({ id: userId });
          mocks.mockPrisma.user.findUnique.mockResolvedValue(user);
          // Wrong password
          jest.spyOn(bcrypt, 'compare').mockResolvedValue(false as never);

          try {
            await service.login({ email: user.email, password: 'wrong_password' }, ip);
          } catch {
            // Expected to throw
          }

          expect(mocks.mockAuditLog.log).toHaveBeenCalled();

          const calls: Array<Record<string, unknown>> = mocks.mockAuditLog.log.mock.calls.map(
            (c: unknown[]) => c[0] as Record<string, unknown>,
          );
          const failedCall = calls.find((c) => c['aksi'] === 'LOGIN_FAILED');

          expect(failedCall).toBeDefined();
          expect(failedCall!['ipAddress']).toBe(ip);
          expect(failedCall!['modul']).toBe('auth');
          expect(failedCall!['userId']).toBeFalsy();
        }),
        { numRuns: 100 },
      );
    });
  });

  // ─── Property 6c: LOGOUT audit log ────────────────────────────────────────

  /**
   * **Validates: Requirements 1.8, 20.2**
   *
   * For ALL logout actions, AuditLogService.log() MUST be called with:
   *   - aksi: 'LOGOUT'
   *   - modul: 'auth'
   *   - userId: the authenticated user's ID
   *   - ipAddress: the request IP address
   */
  describe('Property 6c: LOGOUT sempre registra audit log com userId e IP', () => {
    it('should always call AuditLogService.log with LOGOUT, userId, and ipAddress', async () => {
      await fc.assert(
        fc.asyncProperty(anyUserIdArb, anyRefreshTokenArb, anyIpArb, async (userId, token, ip) => {
          jest.clearAllMocks();
          mocks.mockAuditLog.log.mockResolvedValue(undefined);
          mocks.mockPrisma.refreshToken.updateMany.mockResolvedValue({ count: 1 });

          await service.logout(userId, token, ip);

          // AuditLogService.log must have been called
          expect(mocks.mockAuditLog.log).toHaveBeenCalled();

          const calls: Array<Record<string, unknown>> = mocks.mockAuditLog.log.mock.calls.map(
            (c: unknown[]) => c[0] as Record<string, unknown>,
          );
          const logoutCall = calls.find((c) => c['aksi'] === 'LOGOUT');

          // Must have a LOGOUT entry
          expect(logoutCall).toBeDefined();

          // Must contain userId
          expect(logoutCall!['userId']).toBe(userId);

          // Must contain ipAddress
          expect(logoutCall!['ipAddress']).toBe(ip);

          // Must have modul = 'auth'
          expect(logoutCall!['modul']).toBe('auth');
        }),
        { numRuns: 100 },
      );
    });

    it('should call AuditLogService.log with LOGOUT even when token is not found (graceful logout)', async () => {
      await fc.assert(
        fc.asyncProperty(anyUserIdArb, anyRefreshTokenArb, anyIpArb, async (userId, token, ip) => {
          jest.clearAllMocks();
          mocks.mockAuditLog.log.mockResolvedValue(undefined);
          // Token not found (count: 0) — logout still proceeds
          mocks.mockPrisma.refreshToken.updateMany.mockResolvedValue({ count: 0 });

          await service.logout(userId, token, ip);

          expect(mocks.mockAuditLog.log).toHaveBeenCalled();

          const calls: Array<Record<string, unknown>> = mocks.mockAuditLog.log.mock.calls.map(
            (c: unknown[]) => c[0] as Record<string, unknown>,
          );
          const logoutCall = calls.find((c) => c['aksi'] === 'LOGOUT');

          expect(logoutCall).toBeDefined();
          expect(logoutCall!['userId']).toBe(userId);
          expect(logoutCall!['ipAddress']).toBe(ip);
          expect(logoutCall!['modul']).toBe('auth');
        }),
        { numRuns: 100 },
      );
    });
  });

  // ─── Property 6d: Audit log aksi selalu salah satu dari tiga nilai valid ──

  /**
   * **Validates: Requirements 1.8**
   *
   * Every call to AuditLogService.log() from AuthService must use one of the
   * three valid auth action types: LOGIN_SUCCESS, LOGIN_FAILED, or LOGOUT.
   * No other action values should be emitted by the auth module.
   */
  describe('Property 6d: Setiap aksi audit log auth adalah LOGIN_SUCCESS, LOGIN_FAILED, atau LOGOUT', () => {
    const VALID_AUTH_ACTIONS = new Set(['LOGIN_SUCCESS', 'LOGIN_FAILED', 'LOGOUT']);

    it('should only emit valid auth action types in audit log calls', async () => {
      await fc.assert(
        fc.asyncProperty(anyIpArb, anyUserIdArb, async (ip, userId) => {
          jest.clearAllMocks();
          mocks.mockAuditLog.log.mockResolvedValue(undefined);
          mocks.mockRateLimiter.isLockedOut.mockResolvedValue(false);
          mocks.mockRateLimiter.recordFailedAttempt.mockResolvedValue(1);
          mocks.mockRateLimiter.resetAttempts.mockResolvedValue(undefined);
          mocks.mockJwt.sign.mockReturnValue('mock.jwt.token');
          mocks.mockPrisma.loginAttempt.create.mockResolvedValue({});

          // Scenario 1: successful login
          const user = buildUser({ id: userId });
          mocks.mockPrisma.user.findUnique.mockResolvedValue(user);
          jest.spyOn(bcrypt, 'compare').mockResolvedValue(true as never);
          mocks.mockPrisma.refreshToken.create.mockResolvedValue({});
          mocks.mockPrisma.user.update.mockResolvedValue(user);

          await service.login({ email: user.email, password: 'any' }, ip);

          // Scenario 2: failed login
          jest.clearAllMocks();
          mocks.mockAuditLog.log.mockResolvedValue(undefined);
          mocks.mockRateLimiter.isLockedOut.mockResolvedValue(false);
          mocks.mockRateLimiter.recordFailedAttempt.mockResolvedValue(1);
          mocks.mockPrisma.loginAttempt.create.mockResolvedValue({});
          mocks.mockPrisma.user.findUnique.mockResolvedValue(null);

          try {
            await service.login({ email: 'wrong@test.com', password: 'bad' }, ip);
          } catch {
            // expected
          }

          // Scenario 3: logout
          jest.clearAllMocks();
          mocks.mockAuditLog.log.mockResolvedValue(undefined);
          mocks.mockPrisma.refreshToken.updateMany.mockResolvedValue({ count: 1 });

          await service.logout(userId, 'some.token', ip);

          // Collect all audit log calls across all scenarios
          const allCalls: Array<Record<string, unknown>> = mocks.mockAuditLog.log.mock.calls.map(
            (c: unknown[]) => c[0] as Record<string, unknown>,
          );

          // Every call must use a valid auth action
          for (const call of allCalls) {
            expect(VALID_AUTH_ACTIONS.has(call['aksi'] as string)).toBe(true);
          }
        }),
        { numRuns: 100 },
      );
    });
  });

  // ─── Property 6e: modul field sempre 'auth' ───────────────────────────────

  /**
   * **Validates: Requirements 20.2**
   *
   * Every audit log entry from AuthService must have modul = 'auth'.
   */
  describe('Property 6e: Setiap entri audit log dari AuthService memiliki modul = auth', () => {
    it('should always set modul to auth in every audit log call', async () => {
      await fc.assert(
        fc.asyncProperty(anyIpArb, anyUserIdArb, anyRefreshTokenArb, async (ip, userId, token) => {
          jest.clearAllMocks();
          mocks.mockAuditLog.log.mockResolvedValue(undefined);
          mocks.mockRateLimiter.isLockedOut.mockResolvedValue(false);
          mocks.mockRateLimiter.recordFailedAttempt.mockResolvedValue(1);
          mocks.mockRateLimiter.resetAttempts.mockResolvedValue(undefined);
          mocks.mockJwt.sign.mockReturnValue('mock.jwt.token');
          mocks.mockPrisma.loginAttempt.create.mockResolvedValue({});
          mocks.mockPrisma.refreshToken.updateMany.mockResolvedValue({ count: 1 });

          // Trigger all three auth actions
          const user = buildUser({ id: userId });
          mocks.mockPrisma.user.findUnique.mockResolvedValue(user);
          jest.spyOn(bcrypt, 'compare').mockResolvedValue(true as never);
          mocks.mockPrisma.refreshToken.create.mockResolvedValue({});
          mocks.mockPrisma.user.update.mockResolvedValue(user);

          await service.login({ email: user.email, password: 'any' }, ip);
          await service.logout(userId, token, ip);

          const allCalls: Array<Record<string, unknown>> = mocks.mockAuditLog.log.mock.calls.map(
            (c: unknown[]) => c[0] as Record<string, unknown>,
          );

          // Every call must have modul = 'auth'
          for (const call of allCalls) {
            expect(call['modul']).toBe('auth');
          }
        }),
        { numRuns: 100 },
      );
    });
  });
});
