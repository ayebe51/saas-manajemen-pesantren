import { createParamDecorator, ExecutionContext, UnauthorizedException } from '@nestjs/common';

export const TenantId = createParamDecorator(
  (data: unknown, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    
    // First try to get it from the authenticated user
    if (request.user && request.user.tenantId) {
      return request.user.tenantId;
    }
    
    // If not, check if middleware injected it (for public/api key routes)
    if (request.tenantId) {
      return request.tenantId;
    }

    // Required unless it's a superadmin action
    if (request.user && request.user.role === 'SUPERADMIN') {
        const queryTenantId = request.query.tenantId || request.body.tenantId;
        if(queryTenantId) return queryTenantId;
        
        throw new UnauthorizedException('Superadmin must specify tenantId in query params or body for tenant-specific actions');
    }

    throw new UnauthorizedException('Tenant context is missing');
  },
);
