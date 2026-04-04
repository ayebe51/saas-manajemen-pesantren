import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { UnauthorizedException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import * as fc from 'fast-check';
import { AuthService } from './auth.service';
import { PrismaService } from '../../common/prisma/prisma.service';

describe('AuthService', () => {
  let service: AuthService;

  const mockUser = {
    id: 'user-123',
    email: 'admin@pesantren.com',
    passwordHash: 'hashed_password',
    isActive: true,
    role: 'Admin_Pesantren',
    tenantId: null,
    name: 'Admin',
    role_ref: null,
  };

  const mockPrismaService = {
    user: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    refreshToken: {
      create: jest.fn(),
      findFirst: jest.fn(),
      findUnique: jest.fn(),
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

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: PrismaService, useValue: mockPrismaService },
        { provide: JwtService, useValue: mockJwtService },
        { provide: ConfigService, useValue: mockConfigService },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    jest.clearAllMocks();
    mockJwtService.sign.mockReturnValue('mock.jwt.token');
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  // ─── login ────────────────────────────────────────────────────────────────

  describe('login', () => {
    const loginDto = { email: 'admin@pesantren.com', password: 'password123' };

    it('should throw UnauthorizedException with generic message when user not found', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(null);

      await expect(service.login(loginDto)).rejects.toThrow(UnauthorizedException);
      // Requirements 1.2: error must not reveal account details
      await expect(service.login(loginDto)).rejects.toThrow('Invalid credentials');
    });

    it('should throw UnauthorizedException with generic message when password is wrong', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(mockUser);
      jest.spyOn(bcrypt, 'compare').mockResolvedValue(false as never);

      await expect(service.login(loginDto)).rejects.toThrow('Invalid credentials');
    });

    it('should throw UnauthorizedException with generic message when user is inactive', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue({ ...mockUser, isActive: false });
      jest.spyOn(bcrypt, 'compare').mockResolvedValue(true as never);

      await expect(service.login(loginDto)).rejects.toThrow('Invalid credentials');
    });

    it('should return accessToken, refreshToken, and sanitized user on success', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(mockUser);
      jest.spyOn(bcrypt, 'compare').mockResolvedValue(true as never);
      mockPrismaService.refreshToken.create.mockResolvedValue({});
      mockPrismaService.user.update.mockResolvedValue(mockUser);

      const result = await service.login(loginDto);

      expect(result).toHaveProperty('accessToken');
      expect(result).toHaveProperty('refreshToken');
      expect(result.user).not.toHaveProperty('passwordHash');
    });

    it('should save refresh token hash (not plaintext) to DB', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(mockUser);
      jest.spyOn(bcrypt, 'compare').mockResolvedValue(true as never);
      mockPrismaService.refreshToken.create.mockResolvedValue({});
      mockPrismaService.user.update.mockResolvedValue(mockUser);

      await service.login(loginDto);

      const createCall = mockPrismaService.refreshToken.create.mock.calls[0][0];
      // tokenHash must be a 64-char hex string (SHA-256)
      expect(createCall.data.tokenHash).toMatch(/^[a-f0-9]{64}$/);
      // raw token is also stored for cookie lookup
      expect(createCall.data.token).toBeDefined();
      // hash must differ from raw token
      expect(createCall.data.tokenHash).not.toBe(createCall.data.token);
    });
  });

  // ─── refreshToken ─────────────────────────────────────────────────────────

  describe('refreshToken', () => {
    it('should throw when no token provided', async () => {
      await expect(service.refreshToken('')).rejects.toThrow(UnauthorizedException);
    });

    it('should throw when JWT verification fails', async () => {
      mockJwtService.verify.mockImplementation(() => { throw new Error('expired'); });
      await expect(service.refreshToken('bad.token')).rejects.toThrow(UnauthorizedException);
    });

    it('should throw and revoke all sessions on token reuse (revoked token found)', async () => {
      mockJwtService.verify.mockReturnValue({ sub: 'user-123' });
      // Hash lookup returns nothing (already rotated away)
      mockPrismaService.refreshToken.findFirst
        .mockResolvedValueOnce(null)           // hash lookup
        .mockResolvedValueOnce({               // reuse check by raw token
          userId: 'user-123',
          revoked: true,
        });
      mockPrismaService.refreshToken.updateMany.mockResolvedValue({});

      await expect(service.refreshToken('old.token')).rejects.toThrow(UnauthorizedException);
      expect(mockPrismaService.refreshToken.updateMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: expect.objectContaining({ userId: 'user-123' }) }),
      );
    });

    it('should throw and revoke all sessions when revoked token is presented again', async () => {
      mockJwtService.verify.mockReturnValue({ sub: 'user-123' });
      mockPrismaService.refreshToken.findFirst.mockResolvedValue({
        id: 'rt-1',
        userId: 'user-123',
        revoked: true,
        user: mockUser,
      });
      mockPrismaService.refreshToken.updateMany.mockResolvedValue({});

      await expect(service.refreshToken('reused.token')).rejects.toThrow(
        'Refresh token reuse detected',
      );
      expect(mockPrismaService.refreshToken.updateMany).toHaveBeenCalled();
    });

    it('should rotate tokens and return new pair on valid refresh', async () => {
      mockJwtService.verify.mockReturnValue({ sub: 'user-123' });
      mockPrismaService.refreshToken.findFirst.mockResolvedValue({
        id: 'rt-1',
        userId: 'user-123',
        revoked: false,
        expiresAt: new Date(Date.now() + 86400000),
        user: mockUser,
      });
      mockPrismaService.$transaction.mockResolvedValue([]);

      const result = await service.refreshToken('valid.token');

      expect(result).toHaveProperty('accessToken');
      expect(result).toHaveProperty('newRefreshToken');
      expect(result.user).not.toHaveProperty('passwordHash');
    });
  });

  // ─── logout ───────────────────────────────────────────────────────────────

  describe('logout', () => {
    it('should revoke the specific refresh token for the user', async () => {
      mockPrismaService.refreshToken.updateMany.mockResolvedValue({ count: 1 });

      await service.logout('user-123', 'some.refresh.token');

      expect(mockPrismaService.refreshToken.updateMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ userId: 'user-123', revoked: false }),
          data: expect.objectContaining({ revoked: true }),
        }),
      );
    });

    it('should not throw even if token is not found', async () => {
      mockPrismaService.refreshToken.updateMany.mockResolvedValue({ count: 0 });
      await expect(service.logout('user-123', 'nonexistent.token')).resolves.not.toThrow();
    });
  });
});

// Feature: pesantren-management-app, Property 5: Hash Password Unik per Pengguna
describe('AuthService — Property 5: Hash Password Unik per Pengguna (PBT)', () => {
  /**
   * **Validates: Requirements 1.7**
   *
   * THE Auth_Service SHALL menyimpan password menggunakan algoritma bcrypt atau argon2
   * dengan salt yang unik per pengguna.
   *
   * Properties tested:
   * 1. Hashing the same password twice always produces different hashes (unique salt per call)
   * 2. The hash is never equal to the plaintext password
   */

  // ─── Arbitraries ──────────────────────────────────────────────────────────

  /** Arbitrary password: non-empty string up to 72 chars (bcrypt max) */
  const arbPassword = fc.string({ minLength: 1, maxLength: 72 });

  // ─── Property 5a: Same password → different hashes (unique salt) ──────────

  describe('Property 5a: Hashing the same password twice produces different hashes', () => {
    // bcrypt is intentionally slow; use cost factor 4 (minimum) for test speed
    // while still validating the unique-salt property of the algorithm used in production
    it('should always produce different hashes for the same password (unique salt per user)', async () => {
      // Feature: pesantren-management-app, Property 5: Hash Password Unik per Pengguna
      await fc.assert(
        fc.asyncProperty(arbPassword, async (password) => {
          const BCRYPT_COST_TEST = 4; // minimum valid cost; production uses 12

          const hash1 = await bcrypt.hash(password, BCRYPT_COST_TEST);
          const hash2 = await bcrypt.hash(password, BCRYPT_COST_TEST);

          // Hashes must differ because bcrypt generates a unique salt each time
          expect(hash1).not.toBe(hash2);

          // Both hashes must be valid bcrypt hashes (start with $2b$ and have correct length)
          expect(hash1).toMatch(/^\$2[ab]\$\d{2}\$.{53}$/);
          expect(hash2).toMatch(/^\$2[ab]\$\d{2}\$.{53}$/);
        }),
        { numRuns: 100 },
      );
    }, 60000); // 60s timeout: 100 runs × 2 bcrypt hashes each
  });

  // ─── Property 5b: Hash is never equal to plaintext password ──────────────

  describe('Property 5b: Hash is never equal to the plaintext password', () => {
    it('should never store a hash that equals the plaintext password', async () => {
      // Feature: pesantren-management-app, Property 5: Hash Password Unik per Pengguna
      await fc.assert(
        fc.asyncProperty(arbPassword, async (password) => {
          const BCRYPT_COST_TEST = 4; // minimum valid cost; production uses 12

          const hash = await bcrypt.hash(password, BCRYPT_COST_TEST);

          // Hash must never equal the plaintext
          expect(hash).not.toBe(password);

          // Verify the hash is actually valid and can authenticate the original password
          const isValid = await bcrypt.compare(password, hash);
          expect(isValid).toBe(true);
        }),
        { numRuns: 100 },
      );
    }, 60000); // 60s timeout: 100 runs × 1 bcrypt hash + compare each
  });
});

// Feature: pesantren-management-app, Property 2: Token Lifecycle — Refresh Setelah Expire, Invalidasi Setelah Logout
describe('AuthService — Property 2: Token Lifecycle (PBT)', () => {
  let service: AuthService;

  const buildUser = (overrides: Record<string, unknown> = {}) => ({
    id: 'user-pbt',
    email: 'pbt@pesantren.com',
    passwordHash: 'hashed_password',
    isActive: true,
    role: 'Admin_Pesantren',
    tenantId: null,
    name: 'PBT User',
    role_ref: null,
    ...overrides,
  });

  const mockPrisma = {
    user: { findUnique: jest.fn(), update: jest.fn() },
    refreshToken: {
      create: jest.fn(),
      findFirst: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      updateMany: jest.fn(),
    },
    $transaction: jest.fn(),
  };

  const mockJwt = {
    sign: jest.fn(),
    verify: jest.fn(),
  };

  const mockConfig = {
    get: jest.fn().mockReturnValue(undefined),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: JwtService, useValue: mockJwt },
        { provide: ConfigService, useValue: mockConfig },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    jest.clearAllMocks();
  });

  // ─── Arbitraries ──────────────────────────────────────────────────────────

  /** A plausible user ID (UUID-like string) */
  const arbUserId = fc.uuid();

  /** A plausible raw refresh token (non-empty string, no whitespace) */
  const arbRawToken = fc.stringMatching(/^[A-Za-z0-9._-]{20,80}$/);

  // ─── Property (a): valid refresh token → new access token issued ──────────

  /**
   * **Validates: Requirements 1.3**
   *
   * For any valid (non-revoked, non-expired) refresh token belonging to an
   * active user, calling refreshToken() must:
   *   1. Return a new accessToken
   *   2. Return a new newRefreshToken
   *   3. Not throw
   */
  describe('Property (a): expired access token can be refreshed with a valid refresh token', () => {
    it('should always issue a new access token when refresh token is valid', async () => {
      await fc.assert(
        fc.asyncProperty(arbUserId, arbRawToken, async (userId, rawToken) => {
          jest.clearAllMocks();

          const user = buildUser({ id: userId });

          // JWT verify succeeds (simulates a structurally valid refresh JWT)
          mockJwt.verify.mockReturnValue({ sub: userId });

          // DB returns a non-revoked, non-expired token record
          mockPrisma.refreshToken.findFirst.mockResolvedValue({
            id: 'rt-valid',
            userId,
            revoked: false,
            expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days ahead
            user,
          });

          // Transaction succeeds (revoke old + create new)
          mockPrisma.$transaction.mockResolvedValue([{}, {}]);

          // sign() returns distinct tokens for access vs refresh
          let callCount = 0;
          mockJwt.sign.mockImplementation(() => {
            callCount++;
            return `new.token.${callCount}.${userId.slice(0, 8)}`;
          });

          const result = await service.refreshToken(rawToken);

          // Must return both tokens
          expect(result).toHaveProperty('accessToken');
          expect(result).toHaveProperty('newRefreshToken');
          expect(typeof result.accessToken).toBe('string');
          expect(result.accessToken.length).toBeGreaterThan(0);
          expect(typeof result.newRefreshToken).toBe('string');
          expect(result.newRefreshToken.length).toBeGreaterThan(0);

          // Password hash must not leak
          expect(result.user).not.toHaveProperty('passwordHash');

          // The old token must have been revoked in the transaction
          expect(mockPrisma.$transaction).toHaveBeenCalledTimes(1);
        }),
        { numRuns: 100 },
      );
    });

    it('should throw UnauthorizedException when JWT signature is invalid', async () => {
      await fc.assert(
        fc.asyncProperty(arbRawToken, async (rawToken) => {
          jest.clearAllMocks();

          mockJwt.verify.mockImplementation(() => {
            throw new Error('invalid signature');
          });

          await expect(service.refreshToken(rawToken)).rejects.toThrow(
            UnauthorizedException,
          );
        }),
        { numRuns: 100 },
      );
    });

    it('should throw UnauthorizedException when refresh token is expired in DB', async () => {
      await fc.assert(
        fc.asyncProperty(arbUserId, arbRawToken, async (userId, rawToken) => {
          jest.clearAllMocks();

          mockJwt.verify.mockReturnValue({ sub: userId });

          // DB record exists but expiresAt is in the past
          mockPrisma.refreshToken.findFirst.mockResolvedValue({
            id: 'rt-expired',
            userId,
            revoked: false,
            expiresAt: new Date(Date.now() - 1000), // already expired
            user: buildUser({ id: userId }),
          });

          await expect(service.refreshToken(rawToken)).rejects.toThrow(
            UnauthorizedException,
          );
        }),
        { numRuns: 100 },
      );
    });
  });

  // ─── Property (b): after logout, refresh token cannot be reused ───────────

  /**
   * **Validates: Requirements 1.5**
   *
   * For any user session: after logout() is called, the same refresh token
   * must be treated as revoked. Any subsequent call to refreshToken() with
   * that token must throw UnauthorizedException.
   */
  describe('Property (b): after logout, refresh token is invalidated', () => {
    it('should always reject a revoked refresh token after logout', async () => {
      await fc.assert(
        fc.asyncProperty(arbUserId, arbRawToken, async (userId, rawToken) => {
          jest.clearAllMocks();

          // ── Step 1: logout revokes the token ──────────────────────────────
          mockPrisma.refreshToken.updateMany.mockResolvedValue({ count: 1 });

          await service.logout(userId, rawToken);

          // Verify updateMany was called with revoked: true
          expect(mockPrisma.refreshToken.updateMany).toHaveBeenCalledWith(
            expect.objectContaining({
              where: expect.objectContaining({ userId, revoked: false }),
              data: expect.objectContaining({ revoked: true }),
            }),
          );

          // ── Step 2: attempt to use the same token after logout ────────────
          jest.clearAllMocks();

          mockJwt.verify.mockReturnValue({ sub: userId });

          // DB now returns the token as revoked (simulating post-logout state)
          mockPrisma.refreshToken.findFirst.mockResolvedValue({
            id: 'rt-revoked',
            userId,
            revoked: true, // <-- revoked by logout
            expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
            user: buildUser({ id: userId }),
          });

          mockPrisma.refreshToken.updateMany.mockResolvedValue({ count: 1 });

          // Must throw — token was revoked at logout
          await expect(service.refreshToken(rawToken)).rejects.toThrow(
            UnauthorizedException,
          );
        }),
        { numRuns: 100 },
      );
    });

    it('should always reject when token is not found in DB (already rotated or deleted)', async () => {
      await fc.assert(
        fc.asyncProperty(arbUserId, arbRawToken, async (userId, rawToken) => {
          jest.clearAllMocks();

          mockJwt.verify.mockReturnValue({ sub: userId });

          // Token hash not found — simulates post-logout cleanup or rotation
          mockPrisma.refreshToken.findFirst.mockResolvedValue(null);

          // revokeAllSessionsIfReuse: raw token lookup also returns null
          // (second findFirst call for reuse check)
          mockPrisma.refreshToken.findFirst.mockResolvedValueOnce(null);

          await expect(service.refreshToken(rawToken)).rejects.toThrow(
            UnauthorizedException,
          );
        }),
        { numRuns: 100 },
      );
    });

    it('should complete logout without throwing even for arbitrary token values', async () => {
      await fc.assert(
        fc.asyncProperty(arbUserId, arbRawToken, async (userId, rawToken) => {
          jest.clearAllMocks();

          mockPrisma.refreshToken.updateMany.mockResolvedValue({ count: 0 });

          // logout must never throw regardless of token value
          await expect(service.logout(userId, rawToken)).resolves.not.toThrow();
        }),
        { numRuns: 100 },
      );
    });
  });
});

// Feature: pesantren-management-app, Property 3: Refresh Token Reuse Membatalkan Seluruh Sesi
describe('AuthService — Property 3: Refresh Token Reuse Membatalkan Seluruh Sesi (PBT)', () => {
  let service: AuthService;

  const buildUser = (overrides: Record<string, unknown> = {}) => ({
    id: 'user-pbt3',
    email: 'pbt3@pesantren.com',
    passwordHash: 'hashed_password',
    isActive: true,
    role: 'Admin_Pesantren',
    tenantId: null,
    name: 'PBT3 User',
    role_ref: null,
    ...overrides,
  });

  const mockPrisma = {
    user: { findUnique: jest.fn(), update: jest.fn() },
    refreshToken: {
      create: jest.fn(),
      findFirst: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      updateMany: jest.fn(),
    },
    $transaction: jest.fn(),
  };

  const mockJwt = { sign: jest.fn(), verify: jest.fn() };
  const mockConfig = { get: jest.fn().mockReturnValue(undefined) };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: JwtService, useValue: mockJwt },
        { provide: ConfigService, useValue: mockConfig },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    jest.clearAllMocks();
  });

  // ─── Arbitraries ──────────────────────────────────────────────────────────

  const arbUserId = fc.uuid();
  const arbRawToken = fc.stringMatching(/^[A-Za-z0-9._-]{20,80}$/);

  // ─── Property 3a ──────────────────────────────────────────────────────────

  /**
   * **Validates: Requirements 1.4**
   *
   * Reuse of a revoked token always revokes ALL sessions and returns 401.
   */
  // Feature: pesantren-management-app, Property 3: Refresh Token Reuse Membatalkan Seluruh Sesi
  describe('Property 3a: Reuse of a revoked token always revokes ALL sessions and returns 401', () => {
    it('should always throw UnauthorizedException and call updateMany when revoked token is reused', async () => {
      await fc.assert(
        fc.asyncProperty(
          arbUserId,
          arbRawToken,
          fc.integer({ min: 1, max: 10 }),
          async (userId, rawToken, _sessionCount) => {
            jest.clearAllMocks();

            mockJwt.verify.mockReturnValue({ sub: userId });

            // findFirst returns a record with revoked: true (token already used once)
            mockPrisma.refreshToken.findFirst.mockResolvedValue({
              id: 'rt-reused',
              userId,
              revoked: true,
              expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
              user: buildUser({ id: userId }),
            });

            mockPrisma.refreshToken.updateMany.mockResolvedValue({ count: _sessionCount });

            // 1. Must throw UnauthorizedException
            await expect(service.refreshToken(rawToken)).rejects.toThrow(UnauthorizedException);

            // 2. updateMany must be called with correct where clause
            expect(mockPrisma.refreshToken.updateMany).toHaveBeenCalledWith(
              expect.objectContaining({
                where: expect.objectContaining({ userId, revoked: false }),
                data: expect.objectContaining({ revoked: true }),
              }),
            );

            // 3. Error message must contain "reuse" (case-insensitive)
            let errorMessage = '';
            try {
              await service.refreshToken(rawToken);
            } catch (err) {
              errorMessage = (err as Error).message;
            }
            expect(errorMessage.toLowerCase()).toContain('reuse');
          },
        ),
        { numRuns: 100 },
      );
    });
  });

  // ─── Property 3b ──────────────────────────────────────────────────────────

  /**
   * **Validates: Requirements 1.4**
   *
   * After reuse detection, subsequent refresh attempts with any token for
   * that user also fail (all sessions revoked).
   */
  // Feature: pesantren-management-app, Property 3: Refresh Token Reuse Membatalkan Seluruh Sesi
  describe('Property 3b: After reuse detection, subsequent refresh attempts also fail', () => {
    it('should throw UnauthorizedException for both first (reuse) and second (post-revocation) calls', async () => {
      await fc.assert(
        fc.asyncProperty(
          arbUserId,
          fc.tuple(arbRawToken, arbRawToken).filter(([a, b]) => a !== b),
          async (userId, [firstToken, secondToken]) => {
            jest.clearAllMocks();

            // ── First call: reuse detected (revoked token found by hash) ──
            mockJwt.verify.mockReturnValue({ sub: userId });

            mockPrisma.refreshToken.findFirst.mockResolvedValueOnce({
              id: 'rt-reused',
              userId,
              revoked: true,
              expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
              user: buildUser({ id: userId }),
            });
            mockPrisma.refreshToken.updateMany.mockResolvedValue({ count: 3 });

            await expect(service.refreshToken(firstToken)).rejects.toThrow(UnauthorizedException);

            // ── Second call: all sessions revoked → DB returns null ──
            jest.clearAllMocks();
            mockJwt.verify.mockReturnValue({ sub: userId });

            // Both findFirst calls return null (all sessions revoked)
            mockPrisma.refreshToken.findFirst.mockResolvedValue(null);

            await expect(service.refreshToken(secondToken)).rejects.toThrow(UnauthorizedException);
          },
        ),
        { numRuns: 100 },
      );
    });
  });

  // ─── Property 3c ──────────────────────────────────────────────────────────

  /**
   * **Validates: Requirements 1.4**
   *
   * Reuse detection via raw token fallback: hash not found, but raw token
   * found as revoked → all sessions revoked, 401 returned.
   */
  // Feature: pesantren-management-app, Property 3: Refresh Token Reuse Membatalkan Seluruh Sesi
  describe('Property 3c: Reuse detection via raw token fallback (hash not found, raw token found as revoked)', () => {
    it('should throw UnauthorizedException and call updateMany when raw token fallback detects reuse', async () => {
      await fc.assert(
        fc.asyncProperty(
          arbUserId,
          arbRawToken,
          async (userId, rawToken) => {
            jest.clearAllMocks();

            mockJwt.verify.mockReturnValue({ sub: userId });

            // First findFirst (hash lookup) → null
            mockPrisma.refreshToken.findFirst
              .mockResolvedValueOnce(null)
              // Second findFirst (raw token lookup) → revoked record
              .mockResolvedValueOnce({ userId, revoked: true });

            mockPrisma.refreshToken.updateMany.mockResolvedValue({ count: 2 });

            // 1. Must throw UnauthorizedException
            await expect(service.refreshToken(rawToken)).rejects.toThrow(UnauthorizedException);

            // 2. updateMany must have been called (all sessions revoked)
            expect(mockPrisma.refreshToken.updateMany).toHaveBeenCalled();
          },
        ),
        { numRuns: 100 },
      );
    });
  });

  // ─── Property 3d ──────────────────────────────────────────────────────────

  /**
   * **Validates: Requirements 1.4**
   *
   * Valid (non-revoked) token does NOT trigger session revocation.
   */
  // Feature: pesantren-management-app, Property 3: Refresh Token Reuse Membatalkan Seluruh Sesi
  describe('Property 3d: Valid (non-revoked) token does NOT trigger session revocation', () => {
    it('should NOT call updateMany for mass revocation when token is valid', async () => {
      await fc.assert(
        fc.asyncProperty(
          arbUserId,
          arbRawToken,
          async (userId, rawToken) => {
            jest.clearAllMocks();

            const user = buildUser({ id: userId });

            mockJwt.verify.mockReturnValue({ sub: userId });

            // findFirst returns a valid, non-revoked, non-expired token
            mockPrisma.refreshToken.findFirst.mockResolvedValue({
              id: 'rt-valid',
              userId,
              revoked: false,
              expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
              user,
            });

            // Transaction succeeds (rotate: revoke old + create new)
            mockPrisma.$transaction.mockResolvedValue([{}, {}]);

            let callCount = 0;
            mockJwt.sign.mockImplementation(() => `token.${++callCount}.${userId.slice(0, 8)}`);

            // Should NOT throw
            await expect(service.refreshToken(rawToken)).resolves.toBeDefined();

            // updateMany must NOT have been called (no mass revocation)
            expect(mockPrisma.refreshToken.updateMany).not.toHaveBeenCalled();
          },
        ),
        { numRuns: 100 },
      );
    });
  });
});
