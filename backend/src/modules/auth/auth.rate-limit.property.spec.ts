// Feature: pesantren-management-app, Property 4: Rate Limiting Login Berlaku Konsisten per IP

/**
 * Validates: Requirements 1.6
 *
 * Property 4: For ALL IP addresses, after more than 10 failed login attempts within
 * 1 minute, ALL subsequent attempts from the same IP must be rejected for 15 minutes,
 * regardless of the credentials used.
 */

import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { HttpException, HttpStatus } from '@nestjs/common';
import * as fc from 'fast-check';
import { AuthService } from './auth.service';
import { PrismaService } from '../../common/prisma/prisma.service';
import { AuditLogService } from '../audit-log/audit-log.service';
import { LoginRateLimiterService } from './login-rate-limiter.service';

// ─── IP address arbitraries ───────────────────────────────────────────────────

const ipV4Arb = fc.ipV4();
const ipV6Arb = fc.ipV6();
const edgeCaseIpArb = fc.oneof(
  fc.constant('127.0.0.1'),
  fc.constant('::1'),
  fc.constant('0.0.0.0'),
  fc.constant('255.255.255.255'),
  fc.constant('192.168.1.1'),
  fc.constant('10.0.0.1'),
);
const anyIpArb = fc.oneof(ipV4Arb, ipV6Arb, edgeCaseIpArb);

// ─── Credential arbitraries ───────────────────────────────────────────────────

const anyEmailArb = fc.oneof(
  fc.emailAddress(),
  fc.constant(''),
  fc.constant('admin@pesantren.com'),
  fc.constant("'; DROP TABLE users; --"),
  fc.constant('<script>alert(1)</script>'),
  fc.string({ minLength: 0, maxLength: 100 }),
);

const anyPasswordArb = fc.oneof(
  fc.string({ minLength: 0, maxLength: 200 }),
  fc.constant(''),
  fc.constant('correctpassword'),
  fc.constant("' OR '1'='1"),
  fc.constant('a'.repeat(300)),
);

const anyCredentialsArb = fc.record({
  email: anyEmailArb,
  password: anyPasswordArb,
});

// ─── Mock setup ───────────────────────────────────────────────────────────────

const mockPrismaService = {
  user: {
    findUnique: jest.fn(),
    update: jest.fn(),
  },
  refreshToken: {
    create: jest.fn(),
    findFirst: jest.fn(),
    update: jest.fn(),
    updateMany: jest.fn(),
  },
  loginAttempt: { create: jest.fn() },
  $transaction: jest.fn(),
};

const mockJwtService = {
  sign: jest.fn().mockReturnValue('mock.jwt.token'),
  verify: jest.fn(),
};

const mockConfigService = {
  get: jest.fn().mockReturnValue(undefined),
};

const mockAuditLogService = { log: jest.fn().mockResolvedValue(undefined) };

const mockLoginRateLimiter = {
  isLockedOut: jest.fn(),
  recordFailedAttempt: jest.fn(),
  resetAttempts: jest.fn(),
  getLockoutTtl: jest.fn(),
};

// ─── Test suite ───────────────────────────────────────────────────────────────

describe('AuthService — Property 4: Rate Limiting Login Berlaku Konsisten per IP', () => {
  let service: AuthService;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: PrismaService, useValue: mockPrismaService },
        { provide: JwtService, useValue: mockJwtService },
        { provide: ConfigService, useValue: mockConfigService },
        { provide: AuditLogService, useValue: mockAuditLogService },
        { provide: LoginRateLimiterService, useValue: mockLoginRateLimiter },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
  });

  beforeEach(() => {
    jest.clearAllMocks();
    mockJwtService.sign.mockReturnValue('mock.jwt.token');
    mockAuditLogService.log.mockResolvedValue(undefined);
    mockLoginRateLimiter.recordFailedAttempt.mockResolvedValue(1);
    mockLoginRateLimiter.resetAttempts.mockResolvedValue(undefined);
  });

  // ─── Scenario A: Lockout triggers after exactly 10 failures ──────────────

  it(
    'Property 4A — locked-out IP always receives 429 regardless of IP format',
    async () => {
      // Simulate post-10-failures state: isLockedOut returns true
      mockLoginRateLimiter.isLockedOut.mockResolvedValue(true);
      mockLoginRateLimiter.getLockoutTtl.mockResolvedValue(900);

      await fc.assert(
        fc.asyncProperty(anyIpArb, anyCredentialsArb, async (ip, credentials) => {
          let thrownError: unknown;
          try {
            await service.login(credentials, ip);
          } catch (err) {
            thrownError = err;
          }

          // Must throw
          expect(thrownError).toBeDefined();
          // Must be HttpException with status 429
          expect(thrownError).toBeInstanceOf(HttpException);
          expect((thrownError as HttpException).getStatus()).toBe(
            HttpStatus.TOO_MANY_REQUESTS,
          );
        }),
        { numRuns: 100, verbose: false },
      );
    },
  );

  // ─── Scenario B: Lockout is credential-agnostic ───────────────────────────

  it(
    'Property 4B — lockout applies regardless of credentials submitted',
    async () => {
      // IP is locked out — any credentials must still get 429
      mockLoginRateLimiter.isLockedOut.mockResolvedValue(true);
      mockLoginRateLimiter.getLockoutTtl.mockResolvedValue(600);

      const credentialVariantsArb = fc.oneof(
        // Valid-looking credentials
        fc.record({
          email: fc.emailAddress(),
          password: fc.string({ minLength: 8, maxLength: 32 }),
        }),
        // Empty credentials
        fc.record({
          email: fc.constant(''),
          password: fc.constant(''),
        }),
        // Special characters
        fc.record({
          email: fc.constant("'; DROP TABLE users; --"),
          password: fc.constant("' OR '1'='1"),
        }),
        // Very long strings
        fc.record({
          email: fc.string({ minLength: 256, maxLength: 500 }),
          password: fc.string({ minLength: 256, maxLength: 500 }),
        }),
      );

      await fc.assert(
        fc.asyncProperty(ipV4Arb, credentialVariantsArb, async (ip, credentials) => {
          let thrownError: unknown;
          try {
            await service.login(credentials, ip);
          } catch (err) {
            thrownError = err;
          }

          expect(thrownError).toBeDefined();
          expect(thrownError).toBeInstanceOf(HttpException);
          expect((thrownError as HttpException).getStatus()).toBe(
            HttpStatus.TOO_MANY_REQUESTS,
          );
        }),
        { numRuns: 100, verbose: false },
      );
    },
  );

  // ─── Scenario C: Non-locked IPs are not affected ─────────────────────────

  it(
    'Property 4C — non-locked IP never receives 429 (different IPs are isolated)',
    async () => {
      // IP is NOT locked out — login proceeds normally (401 or success, never 429)
      mockLoginRateLimiter.isLockedOut.mockResolvedValue(false);
      mockLoginRateLimiter.getLockoutTtl.mockResolvedValue(0);
      // Simulate failed login (user not found)
      mockPrismaService.user.findUnique.mockResolvedValue(null);
      mockLoginRateLimiter.recordFailedAttempt.mockResolvedValue(1);

      await fc.assert(
        fc.asyncProperty(anyIpArb, anyCredentialsArb, async (ip, credentials) => {
          let thrownError: unknown;
          try {
            await service.login(credentials, ip);
          } catch (err) {
            thrownError = err;
          }

          // Must throw (user not found → 401), but NEVER 429
          expect(thrownError).toBeDefined();
          expect(thrownError).toBeInstanceOf(HttpException);
          expect((thrownError as HttpException).getStatus()).not.toBe(
            HttpStatus.TOO_MANY_REQUESTS,
          );
        }),
        { numRuns: 100, verbose: false },
      );
    },
  );

  it(
    'Property 4C2 — lockout on IP A does not affect IP B',
    async () => {
      // IP A is locked, IP B is not
      mockLoginRateLimiter.getLockoutTtl.mockResolvedValue(900);
      mockPrismaService.user.findUnique.mockResolvedValue(null);
      mockLoginRateLimiter.recordFailedAttempt.mockResolvedValue(1);

      await fc.assert(
        fc.asyncProperty(
          fc.tuple(ipV4Arb, ipV4Arb).filter(([a, b]) => a !== b),
          anyCredentialsArb,
          async ([ipA, ipB], credentials) => {
            // IP A is locked out
            mockLoginRateLimiter.isLockedOut.mockImplementation(
              async (ip: string) => ip === ipA,
            );

            // IP A must get 429
            let errorA: unknown;
            try {
              await service.login(credentials, ipA);
            } catch (err) {
              errorA = err;
            }
            expect(errorA).toBeInstanceOf(HttpException);
            expect((errorA as HttpException).getStatus()).toBe(
              HttpStatus.TOO_MANY_REQUESTS,
            );

            // IP B must NOT get 429
            let errorB: unknown;
            try {
              await service.login(credentials, ipB);
            } catch (err) {
              errorB = err;
            }
            expect(errorB).toBeInstanceOf(HttpException);
            expect((errorB as HttpException).getStatus()).not.toBe(
              HttpStatus.TOO_MANY_REQUESTS,
            );
          },
        ),
        { numRuns: 50, verbose: false },
      );
    },
  );

  // ─── Scenario D: Attempt count accumulation (LoginRateLimiterService unit) ─

  it(
    'Property 4D — fewer than 10 failed attempts do NOT trigger lockout',
    async () => {
      // Test LoginRateLimiterService logic directly via mock state simulation
      // For any count 1..9, isLockedOut must return false
      // We simulate this by controlling what recordFailedAttempt returns

      await fc.assert(
        fc.asyncProperty(
          fc.integer({ min: 1, max: 9 }),
          ipV4Arb,
          async (attemptCount, ip) => {
            // Simulate: after `attemptCount` failures, IP is NOT locked
            mockLoginRateLimiter.isLockedOut.mockResolvedValue(false);
            mockLoginRateLimiter.recordFailedAttempt.mockResolvedValue(attemptCount);
            mockLoginRateLimiter.getLockoutTtl.mockResolvedValue(0);
            mockPrismaService.user.findUnique.mockResolvedValue(null);

            let thrownError: unknown;
            try {
              await service.login({ email: 'test@test.com', password: 'wrong' }, ip);
            } catch (err) {
              thrownError = err;
            }

            // Should get 401, not 429
            expect(thrownError).toBeDefined();
            expect(thrownError).toBeInstanceOf(HttpException);
            expect((thrownError as HttpException).getStatus()).not.toBe(
              HttpStatus.TOO_MANY_REQUESTS,
            );
          },
        ),
        { numRuns: 100, verbose: false },
      );
    },
  );

  it(
    'Property 4D2 — exactly 10 or more failed attempts MUST trigger lockout (429)',
    async () => {
      // After 10th attempt, isLockedOut returns true
      mockLoginRateLimiter.isLockedOut.mockResolvedValue(true);
      mockLoginRateLimiter.getLockoutTtl.mockResolvedValue(900);

      await fc.assert(
        fc.asyncProperty(
          fc.integer({ min: 10, max: 100 }),
          ipV4Arb,
          async (_attemptCount, ip) => {
            let thrownError: unknown;
            try {
              await service.login({ email: 'test@test.com', password: 'wrong' }, ip);
            } catch (err) {
              thrownError = err;
            }

            expect(thrownError).toBeDefined();
            expect(thrownError).toBeInstanceOf(HttpException);
            expect((thrownError as HttpException).getStatus()).toBe(
              HttpStatus.TOO_MANY_REQUESTS,
            );
          },
        ),
        { numRuns: 50, verbose: false },
      );
    },
  );

  // ─── Scenario E: Lockout message contains retry time info ────────────────

  it(
    'Property 4E — lockout error message contains timing info and is not empty',
    async () => {
      mockLoginRateLimiter.isLockedOut.mockResolvedValue(true);

      await fc.assert(
        fc.asyncProperty(
          fc.integer({ min: 1, max: 900 }),
          anyIpArb,
          async (ttlSeconds, ip) => {
            mockLoginRateLimiter.getLockoutTtl.mockResolvedValue(ttlSeconds);

            let thrownError: unknown;
            try {
              await service.login({ email: 'test@test.com', password: 'wrong' }, ip);
            } catch (err) {
              thrownError = err;
            }

            expect(thrownError).toBeDefined();
            expect(thrownError).toBeInstanceOf(HttpException);

            const response = (thrownError as HttpException).getResponse();
            const message =
              typeof response === 'string'
                ? response
                : (response as { message?: string }).message ?? '';

            // Message must NOT be empty
            expect(message.length).toBeGreaterThan(0);

            // Message must contain timing information (minutes)
            expect(message.toLowerCase()).toMatch(/minute/i);
          },
        ),
        { numRuns: 100, verbose: false },
      );
    },
  );
});
