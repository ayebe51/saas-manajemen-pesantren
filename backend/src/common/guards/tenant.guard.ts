import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';

@Injectable()
export class TenantGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublic) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user;
    
    // Superadmin bypasses tenant checks
    if (user && user.role === 'SUPERADMIN') {
        // If superadmin wants to query a specific tenant, it will be in params/query/body
        // But they are allowed to proceed
        return true;
    }

    // Check if route requires a specific tenant (e.g., via URL param)
    const paramTenantId = request.params.tenantId;
    
    // If it's a regular user and there's a param, it MUST match
    if (user && paramTenantId && user.tenantId !== paramTenantId) {
        throw new ForbiddenException('You do not have access to this tenant data');
    }

    // Validated
    return true;
  }
}
