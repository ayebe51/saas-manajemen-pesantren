import { Injectable, NestMiddleware, UnauthorizedException } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { PrismaService } from '../prisma/prisma.service';

/**
 * Middleware to extract tenant_id from request headers
 * This is useful for public endpoints or when we want to 
 * enforce tenant context before authentication.
 */
@Injectable()
export class TenantMiddleware implements NestMiddleware {
  constructor(private prisma: PrismaService) {}

  async use(req: Request, res: Response, next: NextFunction) {
    const tenantIdHeader = req.headers['x-tenant-id'];

    if (tenantIdHeader) {
      if (typeof tenantIdHeader !== 'string') {
        throw new UnauthorizedException('Invalid x-tenant-id header format');
      }

      // Verify the tenant exists and is active
      const tenant = await this.prisma.tenant.findUnique({
        where: { id: tenantIdHeader },
      });

      if (!tenant) {
        throw new UnauthorizedException('Tenant not found');
      }

      if (tenant.status !== 'ACTIVE') {
        throw new UnauthorizedException('Tenant account is not active');
      }

      // Attach tenant to request for downstream use
      (req as any)['tenantId'] = tenantIdHeader;
    }

    next();
  }
}
