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
