import { ExecutionContext, Injectable } from '@nestjs/common';
import { CacheInterceptor } from '@nestjs/cache-manager';
import { Request } from 'express';

@Injectable()
export class TenantCacheInterceptor extends CacheInterceptor {
  trackBy(context: ExecutionContext): string | undefined {
    // Memanggil logic generik untuk menghasilkan string key dari URL
    const cacheKey = super.trackBy(context);

    if (!cacheKey) {
      return undefined;
    }

    // Ekstraksi HTTP payload request untuk memuat context User JWT
    const request = context.switchToHttp().getRequest<Request>();
    const user = request.user as any;
    const tenantId = user?.tenantId || 'GLOBAL';

    // Appending Tenant ID ke URL Caching Key
    // Format Result: "uuid-tenant:/api/v1/dashboard/summary"
    return `${tenantId}:${cacheKey}`;
  }
}
