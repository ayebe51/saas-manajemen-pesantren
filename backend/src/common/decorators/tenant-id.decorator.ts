import {
  createParamDecorator,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';

export const TenantId = createParamDecorator((data: unknown, ctx: ExecutionContext) => {
  const request = ctx.switchToHttp().getRequest();

  // First try to get it from the authenticated user's JWT payload
  if (request.user && request.user.tenantId) {
    return request.user.tenantId;
  }

  // If not, check if middleware injected it (for public/api key routes)
  if (request.tenantId) {
    return request.tenantId;
  }

  // For SUPERADMIN without tenantId: check query/body override first
  if (request.user && (request.user.role === 'SUPERADMIN' || request.user.role === 'Super_Admin')) {
    const queryTenantId = request.query?.tenantId || request.body?.tenantId;
    if (queryTenantId) return queryTenantId;

    // Return a sentinel value — the service layer will resolve the single tenant
    return '__SUPERADMIN__';
  }

  throw new UnauthorizedException('Tenant context is missing');
});
