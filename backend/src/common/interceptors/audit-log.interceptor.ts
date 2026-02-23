import { Injectable, CallHandler, ExecutionContext, NestInterceptor } from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AuditLogInterceptor implements NestInterceptor {
  constructor(private prisma: PrismaService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const { method, url, user, body, tenantId } = request;

    return next.handle().pipe(
      tap(async (response) => {
        // Only log meaningful actions (POST, PUT, DELETE, PATCH)
        if (['POST', 'PUT', 'DELETE', 'PATCH'].includes(method)) {
          try {
            // Extract entity name from URL, e.g. /api/v1/santri -> Santri
            const pathParts = url.split('?')[0].split('/');
            const entityPart = pathParts[3] || 'unknown';
            
            // Map common actions
            let action = method;
            if (method === 'POST') action = 'CREATE';
            if (method === 'PUT' || method === 'PATCH') action = 'UPDATE';
            if (method === 'DELETE') action = 'DELETE';

            // Determine if there's a specific ID in path
            let entityId = 'unknown';
            if (pathParts.length > 4 && pathParts[4].length > 10) {
              entityId = pathParts[4];
            } else if (response && response.id) {
              entityId = response.id;
            }

            await this.prisma.auditLog.create({
              data: {
                tenantId: tenantId || (user ? user.tenantId : null),
                userId: user ? user.id : null,
                action,
                entity: entityPart.toUpperCase(),
                entityId,
                newValue: JSON.stringify(method !== 'DELETE' ? body : {}),
                ip: request.ip || request.connection.remoteAddress,
              }
            });
          } catch (e) {
            console.error('Audit Log failed', e);
          }
        }
      }),
    );
  }
}
