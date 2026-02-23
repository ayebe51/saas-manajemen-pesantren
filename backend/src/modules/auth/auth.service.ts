import { Injectable, UnauthorizedException, Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
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
    const { email, password, tenantId } = loginDto;
    
    // Find user by email
    const user = await this.prisma.user.findUnique({
      where: { email },
    });

    if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
      throw new UnauthorizedException('Invalid email or password');
    }

    if (!user.isActive) {
      throw new UnauthorizedException('Account is disabled');
    }

    // Tenant validation
    if (user.role !== 'SUPERADMIN' && (!tenantId || user.tenantId !== tenantId)) {
      throw new UnauthorizedException('Invalid tenant scope for this user');
    }

    // Generate tokens
    const accessToken = this.generateAccessToken(user);
    const refreshToken = this.generateRefreshToken(user);

    // Save refresh token to DB
    await this.saveRefreshToken(user.id, refreshToken);

    // Update last login
    await this.prisma.user.update({
      where: { id: user.id },
      data: { lastLogin: new Date() }
    });

    // Return sanitized user data
    const { passwordHash: _, ...sanitizedUser } = user;
    
    return {
      accessToken,
      refreshToken,
      user: sanitizedUser,
    };
  }

  async refreshToken(token: string) {
    if (!token) {
      throw new UnauthorizedException('Refresh token is required');
    }

    try {
      // Decode and verify the refresh token
      const payload = this.jwtService.verify(token, {
        secret: this.configService.get('JWT_REFRESH_SECRET') || 'dev_refresh_secret',
      });

      // Find token in database to check if it's revoked
      const savedToken = await this.prisma.refreshToken.findUnique({
        where: { token },
        include: { user: true }
      });

      if (!savedToken || savedToken.revoked) {
        throw new UnauthorizedException('Refresh token is invalid or has been revoked');
      }

      if (savedToken.user.id !== payload.sub || !savedToken.user.isActive) {
        throw new UnauthorizedException('User is inactive or token belongs to another user');
      }

      // Generate new tokens
      const newAccessToken = this.generateAccessToken(savedToken.user);
      const newRefreshToken = this.generateRefreshToken(savedToken.user);

      // Rotate refresh tokens
      await this.prisma.$transaction([
        this.prisma.refreshToken.delete({ where: { id: savedToken.id } }),
        this.prisma.refreshToken.create({
          data: {
            userId: savedToken.user.id,
            token: newRefreshToken,
            expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
          }
        })
      ]);

      const { passwordHash: _, ...sanitizedUser } = savedToken.user;

      return {
        accessToken: newAccessToken,
        newRefreshToken,
        user: sanitizedUser,
      };

    } catch (error) {
      this.logger.error(`Refresh token error: ${error.message}`);
      throw new UnauthorizedException('Invalid refresh token');
    }
  }

  async logout(userId: string, refreshToken: string) {
    try {
      await this.prisma.refreshToken.updateMany({
        where: { 
          userId, 
          token: refreshToken 
        },
        data: { revoked: true }
      });
    } catch (error) {
      this.logger.error(`Logout error: ${error.message}`);
    }
  }

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
      tokenType: 'refresh'
    };

    return this.jwtService.sign(payload, {
      secret: this.configService.get('JWT_REFRESH_SECRET') || 'dev_refresh_secret',
      expiresIn: this.configService.get('JWT_REFRESH_EXPIRATION') || '7d',
    });
  }

  private async saveRefreshToken(userId: string, token: string): Promise<void> {
    const expiresInDays = 7;
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + expiresInDays);

    await this.prisma.refreshToken.create({
      data: {
        userId,
        token,
        expiresAt,
      },
    });
  }
}
