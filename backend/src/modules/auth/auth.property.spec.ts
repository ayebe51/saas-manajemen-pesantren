// Feature: pesantren-management-app, Property 1: Kredensial Invalid Selalu Menghasilkan 401 Tanpa Detail Akun

/**
 * Validates: Requirements 1.2
 *
 * Property 1: For ALL combinations of invalid username/password, the login endpoint
 * MUST always return HTTP 401 (UnauthorizedException) and the error message MUST NOT
 * contain discriminating information about whether the account exists or the password
 * was wrong (no "user not found", "account does not exist", "wrong password", etc.).
 */

import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { UnauthorizedException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import * as fc from 'fast-check';
import { AuthService } from './auth.service';
import { PrismaService } from '../../common/prisma/prisma.service';

// ─── Discriminating phrases that must NOT appear in error messages ────────────
const DISCRIMINATING_PHRASES = [
  'user not found',
  'account does not exist',
  'account not found',
  'email not found',
  'username not found',
  'wrong password',
  'invalid password',
  'incorrect password',
  'password mismatch',
  'password does not match',
  'no account',
  'pengguna tidak ditemukan',
  'akun tidak ditemukan',
  'email tidak ditemukan',
  'password salah',
  'kata sandi salah',
];

function containsDiscriminatingInfo(message: string): boolean {
  const lower = message.toLowerCase();
  return DISCRIMINATING_PHRASES.some((phrase) => lower.includes(phrase));
}

// ─── Arbitraries ─────────────────────────────────────────────────────────────

/** Generate an email that is guaranteed NOT to be the valid test user's email */
const invalidEmailArb = fc
  .oneof(
    // Random printable strings (not valid emails)
    fc.string({ minLength: 0, maxLength: 100 }),
    // Plausible-looking but non-existent emails
    fc.emailAddress().filter((e) => e !== 'admin@pesantren.com'),
    // Empty string
    fc.constant(''),
    // Special characters
    fc.constant("'; DROP TABLE users; --"),
    fc.constant('<script>alert(1)</script>'),
    // Very long string
    fc.constant('a'.repeat(500) + '@example.com'),
  )
  .filter((e) => e !== 'admin@pesantren.com');

/** Generate an arbitrary password (any string) */
const anyPasswordArb = fc.oneof(
  fc.string({ minLength: 0, maxLength: 200 }),
  fc.constant(''),
  fc.constant('wrongpassword'),
  fc.constant('password123'),
  fc.constant("'; DROP TABLE users; --"),
  fc.constant('a'.repeat(500)),
);

describe('AuthService — Property 1: Kredensial Invalid Selalu Menghasilkan 401 Tanpa Detail Akun', () => {
  let service: AuthService;

  const VALID_EMAIL = 'admin@pesantren.com';
  const VALID_PASSWORD = 'correct_password';
  const VALID_PASSWORD_HASH = '$2b$10$hashedpassword'; // placeholder, overridden per scenario

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
    $transaction: jest.fn(),
  };

  const mockJwtService = {
    sign: jest.fn().mockReturnValue('mock.jwt.token'),
    verify: jest.fn(),
  };

  const mockConfigService = {
    get: jest.fn().mockReturnValue(undefined),
  };

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: PrismaService, useValue: mockPrismaService },
        { provide: JwtService, useValue: mockJwtService },
        { provide: ConfigService, useValue: mockConfigService },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
  });

  beforeEach(() => {
    jest.clearAllMocks();
    mockJwtService.sign.mockReturnValue('mock.jwt.token');
  });

  // ─── Scenario A: Non-existent user (prisma returns null) ─────────────────

  it(
    'Property 1A — non-existent username always yields 401 with generic message',
    async () => {
      // For every arbitrary email/password combo where the user does NOT exist:
      // prisma.user.findUnique returns null → service must throw 401 with generic message
      mockPrismaService.user.findUnique.mockResolvedValue(null);

      await fc.assert(
        fc.asyncProperty(invalidEmailArb, anyPasswordArb, async (email, password) => {
          let thrownError: unknown;
          try {
            await service.login({ email, password });
          } catch (err) {
            thrownError = err;
          }

          // Must throw
          expect(thrownError).toBeDefined();
          // Must be UnauthorizedException (HTTP 401)
          expect(thrownError).toBeInstanceOf(UnauthorizedException);

          const message: string =
            (thrownError as UnauthorizedException).message ?? '';

          // Must NOT contain discriminating information
          expect(containsDiscriminatingInfo(message)).toBe(false);
        }),
        { numRuns: 100, verbose: false },
      );
    },
  );

  // ─── Scenario B: Existing user, wrong password ───────────────────────────

  it(
    'Property 1B — existing username with wrong password always yields 401 with generic message',
    async () => {
      const existingUser = {
        id: 'user-123',
        email: VALID_EMAIL,
        passwordHash: 'hashed_password',
        isActive: true,
        role: 'Admin_Pesantren',
        tenantId: null,
        name: 'Admin',
        role_ref: null,
      };

      // User exists in DB
      mockPrismaService.user.findUnique.mockResolvedValue(existingUser);

      // Mock bcrypt.compare to always return false (wrong password scenario)
      // This avoids real bcrypt computation which is intentionally slow
      jest.spyOn(bcrypt, 'compare').mockResolvedValue(false as never);

      // Generate passwords that are NOT the valid password
      const wrongPasswordArb = fc
        .oneof(
          fc.string({ minLength: 0, maxLength: 200 }),
          fc.constant(''),
          fc.constant('wrongpassword'),
          fc.constant("'; DROP TABLE users; --"),
          fc.constant('a'.repeat(300)),
        )
        .filter((p) => p !== VALID_PASSWORD);

      await fc.assert(
        fc.asyncProperty(wrongPasswordArb, async (wrongPassword) => {
          let thrownError: unknown;
          try {
            await service.login({ email: VALID_EMAIL, password: wrongPassword });
          } catch (err) {
            thrownError = err;
          }

          expect(thrownError).toBeDefined();
          expect(thrownError).toBeInstanceOf(UnauthorizedException);

          const message: string =
            (thrownError as UnauthorizedException).message ?? '';

          expect(containsDiscriminatingInfo(message)).toBe(false);
        }),
        { numRuns: 100, verbose: false },
      );
    },
  );

  // ─── Scenario C: Empty credentials ───────────────────────────────────────

  it(
    'Property 1C — empty or blank credentials always yield 401 with generic message',
    async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(null);

      const emptyCredArb = fc.record({
        email: fc.oneof(fc.constant(''), fc.constant('   '), fc.constant('\t')),
        password: fc.oneof(fc.constant(''), fc.constant('   '), fc.constant('\t')),
      });

      await fc.assert(
        fc.asyncProperty(emptyCredArb, async ({ email, password }) => {
          let thrownError: unknown;
          try {
            await service.login({ email, password });
          } catch (err) {
            thrownError = err;
          }

          expect(thrownError).toBeDefined();
          expect(thrownError).toBeInstanceOf(UnauthorizedException);

          const message: string =
            (thrownError as UnauthorizedException).message ?? '';

          expect(containsDiscriminatingInfo(message)).toBe(false);
        }),
        { numRuns: 20, verbose: false },
      );
    },
  );

  // ─── Scenario D: Special characters and injection attempts ───────────────

  it(
    'Property 1D — special characters and injection attempts always yield 401 with generic message',
    async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(null);

      const specialCharArb = fc.record({
        email: fc.oneof(
          fc.constant("'; DROP TABLE users; --"),
          fc.constant('<script>alert(1)</script>'),
          fc.constant('admin\x00@evil.com'),
          fc.constant('../../etc/passwd'),
          fc.constant('\u0000\u0001\u0002'),
          fc.string({ minLength: 1, maxLength: 50 }).map((s) => s + '!@#$%^&*()'),
        ),
        password: fc.oneof(
          fc.constant("' OR '1'='1"),
          fc.constant('<script>'),
          fc.constant('\x00\x01\x02'),
          fc.string({ minLength: 1, maxLength: 50 }).map((s) => s + '!@#$%'),
        ),
      });

      await fc.assert(
        fc.asyncProperty(specialCharArb, async ({ email, password }) => {
          let thrownError: unknown;
          try {
            await service.login({ email, password });
          } catch (err) {
            thrownError = err;
          }

          expect(thrownError).toBeDefined();
          expect(thrownError).toBeInstanceOf(UnauthorizedException);

          const message: string =
            (thrownError as UnauthorizedException).message ?? '';

          expect(containsDiscriminatingInfo(message)).toBe(false);
        }),
        { numRuns: 50, verbose: false },
      );
    },
  );

  // ─── Scenario E: Very long strings ───────────────────────────────────────

  it(
    'Property 1E — very long email/password strings always yield 401 with generic message',
    async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(null);

      const longStringArb = fc.record({
        email: fc.string({ minLength: 256, maxLength: 1000 }),
        password: fc.string({ minLength: 256, maxLength: 1000 }),
      });

      await fc.assert(
        fc.asyncProperty(longStringArb, async ({ email, password }) => {
          let thrownError: unknown;
          try {
            await service.login({ email, password });
          } catch (err) {
            thrownError = err;
          }

          expect(thrownError).toBeDefined();
          expect(thrownError).toBeInstanceOf(UnauthorizedException);

          const message: string =
            (thrownError as UnauthorizedException).message ?? '';

          expect(containsDiscriminatingInfo(message)).toBe(false);
        }),
        { numRuns: 30, verbose: false },
      );
    },
  );

  // ─── Scenario F: Inactive user (account exists but disabled) ─────────────

  it(
    'Property 1F — inactive account always yields 401 with generic message (no "account disabled" detail)',
    async () => {
      const inactiveUser = {
        id: 'user-456',
        email: VALID_EMAIL,
        passwordHash: 'hashed_password',
        isActive: false,
        role: 'Admin_Pesantren',
        tenantId: null,
        name: 'Inactive Admin',
        role_ref: null,
      };

      mockPrismaService.user.findUnique.mockResolvedValue(inactiveUser);

      // Mock bcrypt.compare to return true (simulating correct password)
      // This ensures we reach the isActive check, which is the path we want to test
      jest.spyOn(bcrypt, 'compare').mockResolvedValue(true as never);

      // Even with the correct password, inactive user must get generic 401
      await fc.assert(
        fc.asyncProperty(anyPasswordArb, async (password) => {
          let thrownError: unknown;
          try {
            await service.login({ email: VALID_EMAIL, password });
          } catch (err) {
            thrownError = err;
          }

          expect(thrownError).toBeDefined();
          expect(thrownError).toBeInstanceOf(UnauthorizedException);

          const message: string =
            (thrownError as UnauthorizedException).message ?? '';

          // Must not reveal that the account is disabled/inactive
          expect(message.toLowerCase()).not.toContain('inactive');
          expect(message.toLowerCase()).not.toContain('disabled');
          expect(message.toLowerCase()).not.toContain('nonaktif');
          expect(message.toLowerCase()).not.toContain('dinonaktifkan');
          expect(containsDiscriminatingInfo(message)).toBe(false);
        }),
        { numRuns: 50, verbose: false },
      );
    },
  );
});
