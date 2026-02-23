"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TenantId = void 0;
const common_1 = require("@nestjs/common");
exports.TenantId = (0, common_1.createParamDecorator)((data, ctx) => {
    const request = ctx.switchToHttp().getRequest();
    if (request.user && request.user.tenantId) {
        return request.user.tenantId;
    }
    if (request.tenantId) {
        return request.tenantId;
    }
    if (request.user && request.user.role === 'SUPERADMIN') {
        const queryTenantId = request.query.tenantId || request.body.tenantId;
        if (queryTenantId)
            return queryTenantId;
        throw new common_1.UnauthorizedException('Superadmin must specify tenantId in query params or body for tenant-specific actions');
    }
    throw new common_1.UnauthorizedException('Tenant context is missing');
});
//# sourceMappingURL=tenant-id.decorator.js.map