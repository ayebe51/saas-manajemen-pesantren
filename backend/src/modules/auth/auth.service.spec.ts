import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { UnauthorizedException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
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
