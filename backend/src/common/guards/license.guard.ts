import {
  Injectable,
  CanActivate,
  ExecutionContext,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';
import { LicenseService } from '../../modules/license/license.service';

/**
 * LicenseGuard enforces license status on all write operations.
 * Pipeline: Request → Nginx → RateLimitMiddleware → JwtAuthGuard → RolesGuard → LicenseGuard → Controller
 *
 * Rules:
 * - @Public() endpoints: always pass through
 * - ACTIVE: all requests pass
 * - GRACE_PERIOD: GET requests pass; write operations (POST/PUT/PATCH/DELETE) pass with warning header
 * - EXPIRED / REVOKED / INACTIVE: GET requests pass; write operations blocked with HTTP 503
 *
 * Requirements: 19.3, 19.4
 */
@Injectable()
export class LicenseGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly licenseService: LicenseService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    // Skip for @Public() endpoints
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) return true;

    const request = context.switchToHttp().getRequest();
    const method: string = request.method?.toUpperCase() ?? 'GET';
    const isReadRequest = method === 'GET' || method === 'HEAD' || method === 'OPTIONS';

    const status = await this.licenseService.getLicenseStatus();

    switch (status.status) {
      case 'ACTIVE':
        return true;

      case 'GRACE_PERIOD':
        // Allow all requests during grace period but add warning header — Requirement 19.3
        if (!isReadRequest) {
          const response = context.switchToHttp().getResponse();
          response.setHeader(
            'X-License-Warning',
            `License offline grace period active. ${status.daysRemaining ?? 0} day(s) remaining. Please reconnect to verify.`,
          );
        }
        return true;

      case 'EXPIRED':
      case 'REVOKED':
      case 'INACTIVE':
        // Block write operations — Requirement 19.4
        if (!isReadRequest) {
          throw new HttpException(
            {
              statusCode: HttpStatus.SERVICE_UNAVAILABLE,
              message: `System is in read-only mode. License status: ${status.status}. Please contact your administrator to renew or activate the license.`,
              licenseStatus: status.status,
            },
            HttpStatus.SERVICE_UNAVAILABLE,
          );
        }
        return true;

      default:
        return true;
    }
  }
}
