import { Injectable, CallHandler, ExecutionContext, NestInterceptor } from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { AuditLogService } from '../../modules/audit-log/audit-log.service';

/**
 * AuditLogInterceptor — general-purpose interceptor for modules that opt in.
 * Logs POST/PUT/PATCH/DELETE actions via AuditLogService (insert-only).
 * Requirements: 20.1, 20.2, 20.4
 */
@Injectable()
export class AuditLogInterceptor implements NestInterceptor {
  constructor(private readonly auditLogService: AuditLogService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const { method, url, user, body } = request;

    return next.handle().pipe(
      tap(async (response) => {
        if (!['POST', 'PUT', 'DELETE', 'PATCH'].includes(method)) return;

        try {
          const pathParts = url.split('?')[0].split('/');
          const modul = pathParts[3] || 'unknown';

          let aksi = method;
          if (method === 'POST') aksi = 'CREATE';
          if (method === 'PUT' || method === 'PATCH') aksi = 'UPDATE';
          if (method === 'DELETE') aksi = 'DELETE';

          let entitasId: string | undefined;
          if (pathParts.length > 4 && pathParts[4]?.length > 10) {
            entitasId = pathParts[4];
          } else if (response?.id) {
            entitasId = response.id;
          }

          const ipAddress =
            request.ip ||
            request.headers['x-forwarded-for']?.split(',')[0]?.trim() ||
            request.connection?.remoteAddress;

          await this.auditLogService.log({
            userId: user?.id,
            aksi,
            modul: modul.toUpperCase(),
            entitasId,
            nilaiAfter: method !== 'DELETE' ? body : undefined,
            ipAddress,
          });
        } catch (e) {
          // Interceptor errors must never break the response
        }
      }),
    );
  }
}
