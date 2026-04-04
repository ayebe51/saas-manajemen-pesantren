import {
  Injectable,
  UnauthorizedException,
  Logger,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import { PrismaService } from '../../common/prisma/prisma.service';
import { LoginDto } from './dto/login.dto';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  async login(loginDto: LoginDto) {
    const { email, password } = loginDto;

    // Find user by email — always use same generic error to avoid account enumeration
    const user = await this.prisma.user.findUnique({
      where: { email },
      include: { role_ref: { include: { permissions: true } } },
    });

    const isPasswordValid =
      user != null && (await bcrypt.compare(password, user.passwordHash));

    if (!user || !isPasswordValid) {
      // Generic error — Requirements 1.2: no detail about whether account exists
      throw new UnauthorizedException('Invalid credentials');
    }

    if (!user.isActive) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Generate tokens
    const accessToken = this.generateAccessToken(user);
    const rawRefreshToken = this.generateRefreshToken(user);
    const tokenHash = this.hashToken(rawRefreshToken);

    // Save refresh token as hash — Requirements 1.7 / design spec
    await this.prisma.refreshToken.create({
      data: {
        userId: user.id,
        token: rawRefreshToken,   // kept for cookie lookup convenience
        tokenHash,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      },
    });

    // Update last login
    await this.prisma.user.update({
      where: { id: user.id },
      data: { lastLogin: new Date() },
    });

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { passwordHash, ...sanitizedUser } = user;

    return { accessToken, refreshToken: rawRefreshToken, user: sanitizedUser };
  }

  async refreshToken(token: string) {
    if (!token) {
      throw new UnauthorizedException('Refresh token is required');
    }

    try {
      // Verify JWT signature and expiry first
      this.jwtService.verify(token, {
        secret:
          this.configService.get('JWT_REFRESH_SECRET') || 'dev_refresh_secret',
      });
    } catch {
      throw new UnauthorizedException('Invalid refresh token');
    }

    const tokenHash = this.hashToken(token);

    // Look up by hash
    const savedToken = await this.prisma.refreshToken.findFirst({
      where: { tokenHash },
      include: { user: true },
    });

    if (!savedToken) {
      // Token hash not found — could be reuse of an already-rotated token.
      // Detect reuse: find any revoked token with this hash and revoke all sessions.
      await this.revokeAllSessionsIfReuse(token);
      throw new UnauthorizedException('Invalid refresh token');
    }

    if (savedToken.revoked) {
      // Token was already used — REUSE DETECTED — revoke all sessions for this user
      // Requirements 1.4
      await this.revokeAllUserSessions(savedToken.userId);
      throw new UnauthorizedException('Refresh token reuse detected. All sessions revoked.');
    }

    if (savedToken.expiresAt < new Date()) {
      throw new UnauthorizedException('Refresh token expired');
    }

    if (!savedToken.user.isActive) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    // Rotate: revoke old token, issue new one
    const newRawRefreshToken = this.generateRefreshToken(savedToken.user);
    const newTokenHash = this.hashToken(newRawRefreshToken);
    const newAccessToken = this.generateAccessToken(savedToken.user);

    await this.prisma.$transaction([
      // Mark old token as revoked (not deleted — needed for reuse detection)
      this.prisma.refreshToken.update({
        where: { id: savedToken.id },
        data: { revoked: true, revokedAt: new Date() },
      }),
      // Create new token
      this.prisma.refreshToken.create({
        data: {
          userId: savedToken.user.id,
          token: newRawRefreshToken,
          tokenHash: newTokenHash,
          expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        },
      }),
    ]);

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { passwordHash, ...sanitizedUser } = savedToken.user;

    return {
      accessToken: newAccessToken,
      newRefreshToken: newRawRefreshToken,
      user: sanitizedUser,
    };
  }

  async logout(userId: string, refreshToken: string) {
    try {
      const tokenHash = this.hashToken(refreshToken);
      // Revoke the specific token — Requirements 1.5
      await this.prisma.refreshToken.updateMany({
        where: { userId, tokenHash, revoked: false },
        data: { revoked: true, revokedAt: new Date() },
      });
    } catch (error) {
      this.logger.error(`Logout error: ${error.message}`);
    }
  }

  async scannerLogin(pin: string) {
    if (!pin) {
      throw new UnauthorizedException('Scanner PIN is required');
    }

    const tenant = await this.prisma.tenant.findUnique({ where: { scannerPin: pin } });

    if (!tenant) {
      throw new UnauthorizedException('Invalid Scanner PIN');
    }

    if (tenant.status !== 'ACTIVE') {
      throw new UnauthorizedException('Tenant is not active');
    }

    const payload = {
      sub: tenant.id,
      email: `scanner@${tenant.id}`,
      role: 'SCANNER',
      tenantId: tenant.id,
    };

    const accessToken = this.jwtService.sign(payload, {
      secret: this.configService.get('JWT_SECRET') || 'dev_secret_key',
      expiresIn: '7d',
    });

    return { accessToken, tenantId: tenant.id, tenantName: tenant.name };
  }

  async saveFcmToken(userId: string, token: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new UnauthorizedException('User not found');

    let tokens: string[] = [];
    if (user.fcmTokens) {
      try {
        tokens = JSON.parse(user.fcmTokens);
      } catch {
        tokens = [];
      }
    }

    if (!tokens.includes(token)) {
      tokens.push(token);
      await this.prisma.user.update({
        where: { id: userId },
        data: { fcmTokens: JSON.stringify(tokens) },
      });
    }

    return { success: true };
  }

  // ─── Private helpers ────────────────────────────────────────────────────────

  private generateAccessToken(user: any): string {
    const payload = {
      sub: user.id,
      email: user.email,
      role: user.role,
      tenantId: user.tenantId,
    };
    return this.jwtService.sign(payload, {
      secret: this.configService.get('JWT_SECRET') || 'dev_secret_key',
      expiresIn: this.configService.get('JWT_EXPIRATION') || '15m',
    });
  }

  private generateRefreshToken(user: any): string {
    const payload = {
      sub: user.id,
      email: user.email,
      tokenType: 'refresh',
    };
    return this.jwtService.sign(payload, {
      secret:
        this.configService.get('JWT_REFRESH_SECRET') || 'dev_refresh_secret',
      expiresIn: this.configService.get('JWT_REFRESH_EXPIRATION') || '7d',
    });
  }

  /** SHA-256 hash of a token — stored in DB instead of plaintext */
  private hashToken(token: string): string {
    return crypto.createHash('sha256').update(token).digest('hex');
  }

  /** Revoke all active refresh tokens for a user (reuse attack response) */
  private async revokeAllUserSessions(userId: string): Promise<void> {
    await this.prisma.refreshToken.updateMany({
      where: { userId, revoked: false },
      data: { revoked: true, revokedAt: new Date() },
    });
    this.logger.warn(`All sessions revoked for user ${userId} due to refresh token reuse`);
  }

  /**
   * When a token hash is not found at all, check if it belongs to a revoked token
   * (meaning the raw token was stored before hash-only migration or is a reuse attempt).
   * If found as revoked, revoke all sessions for that user.
   */
  private async revokeAllSessionsIfReuse(rawToken: string): Promise<void> {
    try {
      const revokedToken = await this.prisma.refreshToken.findFirst({
        where: { token: rawToken, revoked: true },
      });
      if (revokedToken) {
        await this.revokeAllUserSessions(revokedToken.userId);
      }
    } catch (error) {
      this.logger.error(`Reuse check error: ${error.message}`);
    }
  }
}
