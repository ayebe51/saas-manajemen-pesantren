import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../../common/prisma/prisma.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private readonly configService: ConfigService,
    private readonly prisma: PrismaService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('JWT_SECRET') || 'dev_secret_key',
    });
  }

  async validate(payload: any) {
    if (payload.role === 'SCANNER') {
      // Bypass User check for SCANNER tokens, just ensure the tenant exists
      const tenant = await this.prisma.tenant.findUnique({
        where: { id: payload.sub },
      });

      if (!tenant) {
        throw new UnauthorizedException('Invalid scanner token or tenant does not exist');
      }

      return {
        id: payload.sub,
        email: payload.email,
        role: payload.role,
        tenantId: payload.tenantId,
      };
    }

    const user = await this.prisma.user.findUnique({
      where: { id: payload.sub },
    });

    if (!user) {
      throw new UnauthorizedException('Invalid token or user does not exist');
    }

    if (user.role !== 'SUPERADMIN' && user.tenantId !== payload.tenantId) {
      throw new UnauthorizedException('Invalid token or tenant mismatch');
    }

    return {
      id: payload.sub,
      email: payload.email,
      role: payload.role,
      tenantId: payload.tenantId,
    };
  }
}
