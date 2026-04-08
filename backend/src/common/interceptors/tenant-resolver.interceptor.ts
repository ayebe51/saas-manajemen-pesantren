import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { Observable } from 'rxjs';
import { PrismaService } from '../prisma/prisma.service';

/**
 * Resolves tenantId for SUPERADMIN users who don't have tenantId in JWT.
 * In single-tenant mode, automatically assigns the first (and only) tenant.
 */
@Injectable()
export class TenantResolverInterceptor implements NestInterceptor {
  private cachedTenantId: string | null = null;

  constructor(private readonly prisma: PrismaService) {}

  async intercept(context: ExecutionContext, next: CallHandler): Promise<Observable<any>> {
    const request = context.switchToHttp().getRequest();
    const user = request.user;

    // If user is authenticated but has no tenantId, resolve it
    if (user && !user.tenantId) {
      if (!this.cachedTenantId) {
        const tenant = await this.prisma.tenant.findFirst({
          where: { status: 'ACTIVE' },
          select: { id: true },
        });
        this.cachedTenantId = tenant?.id ?? null;
      }
      if (this.cachedTenantId) {
        user.tenantId = this.cachedTenantId;
        request.user = user;
      }
    }

    return next.handle();
  }
}
