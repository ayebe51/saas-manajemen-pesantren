"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuditLogInterceptor = void 0;
const common_1 = require("@nestjs/common");
const operators_1 = require("rxjs/operators");
const prisma_service_1 = require("../prisma/prisma.service");
let AuditLogInterceptor = class AuditLogInterceptor {
    constructor(prisma) {
        this.prisma = prisma;
    }
    intercept(context, next) {
        const request = context.switchToHttp().getRequest();
        const { method, url, user, body, tenantId } = request;
        return next.handle().pipe((0, operators_1.tap)(async (response) => {
            if (['POST', 'PUT', 'DELETE', 'PATCH'].includes(method)) {
                try {
                    const pathParts = url.split('?')[0].split('/');
                    const entityPart = pathParts[3] || 'unknown';
                    let action = method;
                    if (method === 'POST')
                        action = 'CREATE';
                    if (method === 'PUT' || method === 'PATCH')
                        action = 'UPDATE';
                    if (method === 'DELETE')
                        action = 'DELETE';
                    let entityId = 'unknown';
                    if (pathParts.length > 4 && pathParts[4].length > 10) {
                        entityId = pathParts[4];
                    }
                    else if (response && response.id) {
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
                        },
                    });
                }
                catch (e) {
                    console.error('Audit Log failed', e);
                }
            }
        }));
    }
};
exports.AuditLogInterceptor = AuditLogInterceptor;
exports.AuditLogInterceptor = AuditLogInterceptor = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], AuditLogInterceptor);
//# sourceMappingURL=audit-log.interceptor.js.map