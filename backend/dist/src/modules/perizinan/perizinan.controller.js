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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PerizinanController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const perizinan_service_1 = require("./perizinan.service");
const izin_dto_1 = require("./dto/izin.dto");
const jwt_auth_guard_1 = require("../../common/guards/jwt-auth.guard");
const roles_guard_1 = require("../../common/guards/roles.guard");
const roles_decorator_1 = require("../../common/decorators/roles.decorator");
const tenant_id_decorator_1 = require("../../common/decorators/tenant-id.decorator");
const public_decorator_1 = require("../../common/decorators/public.decorator");
const audit_log_interceptor_1 = require("../../common/interceptors/audit-log.interceptor");
let PerizinanController = class PerizinanController {
    constructor(perizinanService) {
        this.perizinanService = perizinanService;
    }
    create(createIzinDto, tenantId, req) {
        return this.perizinanService.create(tenantId, createIzinDto, req.user.id);
    }
    findAll(tenantId, status, santriId) {
        return this.perizinanService.findAll(tenantId, { status, santriId });
    }
    findOne(id, tenantId) {
        return this.perizinanService.findOne(id, tenantId);
    }
    approve(id, approveIzinDto) {
        return this.perizinanService.approve(id, approveIzinDto);
    }
    checkout(id, tenantId, req) {
        return this.perizinanService.checkout(id, tenantId, req.user.id);
    }
    checkin(id, tenantId, req) {
        return this.perizinanService.checkin(id, tenantId, req.user.id);
    }
};
exports.PerizinanController = PerizinanController;
__decorate([
    (0, common_1.Post)(),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)('SUPERADMIN', 'TENANT_ADMIN', 'PENGURUS', 'MUSYRIF'),
    (0, common_1.UseInterceptors)(audit_log_interceptor_1.AuditLogInterceptor),
    (0, swagger_1.ApiOperation)({ summary: 'Submit a new leave permit (Izin)' }),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, tenant_id_decorator_1.TenantId)()),
    __param(2, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [izin_dto_1.CreateIzinDto, String, Object]),
    __metadata("design:returntype", void 0)
], PerizinanController.prototype, "create", null);
__decorate([
    (0, common_1.Get)(),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, swagger_1.ApiOperation)({ summary: 'Get all permits' }),
    (0, swagger_1.ApiQuery)({ name: 'status', required: false, enum: ['PENDING', 'APPROVED', 'REJECTED', 'CHECKED_OUT', 'CHECKED_IN', 'EXPIRED'] }),
    (0, swagger_1.ApiQuery)({ name: 'santriId', required: false }),
    __param(0, (0, tenant_id_decorator_1.TenantId)()),
    __param(1, (0, common_1.Query)('status')),
    __param(2, (0, common_1.Query)('santriId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String]),
    __metadata("design:returntype", void 0)
], PerizinanController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)(':id'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiOperation)({ summary: 'Get permit details' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, tenant_id_decorator_1.TenantId)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", void 0)
], PerizinanController.prototype, "findOne", null);
__decorate([
    (0, common_1.Post)(':id/approve'),
    (0, public_decorator_1.Public)(),
    (0, swagger_1.ApiOperation)({ summary: 'Approve or Reject permit (Wali)' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, izin_dto_1.ApproveIzinDto]),
    __metadata("design:returntype", void 0)
], PerizinanController.prototype, "approve", null);
__decorate([
    (0, common_1.Post)(':id/checkout'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)('SUPERADMIN', 'TENANT_ADMIN', 'PENGURUS'),
    (0, common_1.UseInterceptors)(audit_log_interceptor_1.AuditLogInterceptor),
    (0, swagger_1.ApiOperation)({ summary: 'Record student leaving (Scan QR)' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, tenant_id_decorator_1.TenantId)()),
    __param(2, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, Object]),
    __metadata("design:returntype", void 0)
], PerizinanController.prototype, "checkout", null);
__decorate([
    (0, common_1.Post)(':id/checkin'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)('SUPERADMIN', 'TENANT_ADMIN', 'PENGURUS'),
    (0, common_1.UseInterceptors)(audit_log_interceptor_1.AuditLogInterceptor),
    (0, swagger_1.ApiOperation)({ summary: 'Record student returning (Scan QR)' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, tenant_id_decorator_1.TenantId)()),
    __param(2, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, Object]),
    __metadata("design:returntype", void 0)
], PerizinanController.prototype, "checkin", null);
exports.PerizinanController = PerizinanController = __decorate([
    (0, swagger_1.ApiTags)('Perizinan'),
    (0, common_1.Controller)('izin'),
    __metadata("design:paramtypes", [perizinan_service_1.PerizinanService])
], PerizinanController);
//# sourceMappingURL=perizinan.controller.js.map