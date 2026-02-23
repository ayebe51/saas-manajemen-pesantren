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
exports.CatatanController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const catatan_service_1 = require("./catatan.service");
const catatan_dto_1 = require("./dto/catatan.dto");
const jwt_auth_guard_1 = require("../../common/guards/jwt-auth.guard");
const roles_guard_1 = require("../../common/guards/roles.guard");
const roles_decorator_1 = require("../../common/decorators/roles.decorator");
const tenant_id_decorator_1 = require("../../common/decorators/tenant-id.decorator");
const audit_log_interceptor_1 = require("../../common/interceptors/audit-log.interceptor");
let CatatanController = class CatatanController {
    constructor(catatanService) {
        this.catatanService = catatanService;
    }
    createCatatan(createCatatanDto, tenantId, req) {
        return this.catatanService.createCatatan(tenantId, createCatatanDto, req.user.id);
    }
    findAllCatatan(tenantId, santriId) {
        return this.catatanService.findAllCatatan(tenantId, santriId);
    }
    createPengumuman(createPengumumanDto, tenantId) {
        return this.catatanService.createPengumuman(tenantId, createPengumumanDto);
    }
    findAllPengumuman(tenantId, audience) {
        return this.catatanService.findAllPengumuman(tenantId, audience);
    }
};
exports.CatatanController = CatatanController;
__decorate([
    (0, common_1.Post)('catatan'),
    (0, roles_decorator_1.Roles)('SUPERADMIN', 'TENANT_ADMIN', 'PENGURUS', 'MUSYRIF', 'GURU'),
    (0, common_1.UseInterceptors)(audit_log_interceptor_1.AuditLogInterceptor),
    (0, swagger_1.ApiOperation)({ summary: 'Create a new daily note for a student' }),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, tenant_id_decorator_1.TenantId)()),
    __param(2, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [catatan_dto_1.CreateCatatanDto, String, Object]),
    __metadata("design:returntype", void 0)
], CatatanController.prototype, "createCatatan", null);
__decorate([
    (0, common_1.Get)('catatan'),
    (0, swagger_1.ApiOperation)({ summary: 'Get daily notes' }),
    (0, swagger_1.ApiQuery)({ name: 'santriId', required: false }),
    __param(0, (0, tenant_id_decorator_1.TenantId)()),
    __param(1, (0, common_1.Query)('santriId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", void 0)
], CatatanController.prototype, "findAllCatatan", null);
__decorate([
    (0, common_1.Post)('pengumuman'),
    (0, roles_decorator_1.Roles)('SUPERADMIN', 'TENANT_ADMIN', 'PENGURUS'),
    (0, common_1.UseInterceptors)(audit_log_interceptor_1.AuditLogInterceptor),
    (0, swagger_1.ApiOperation)({ summary: 'Create an announcement' }),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, tenant_id_decorator_1.TenantId)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [catatan_dto_1.CreatePengumumanDto, String]),
    __metadata("design:returntype", void 0)
], CatatanController.prototype, "createPengumuman", null);
__decorate([
    (0, common_1.Get)('pengumuman'),
    (0, swagger_1.ApiOperation)({ summary: 'Get announcements' }),
    (0, swagger_1.ApiQuery)({ name: 'audience', required: false }),
    __param(0, (0, tenant_id_decorator_1.TenantId)()),
    __param(1, (0, common_1.Query)('audience')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", void 0)
], CatatanController.prototype, "findAllPengumuman", null);
exports.CatatanController = CatatanController = __decorate([
    (0, swagger_1.ApiTags)('Buku Penghubung'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, common_1.Controller)(),
    __metadata("design:paramtypes", [catatan_service_1.CatatanService])
], CatatanController);
//# sourceMappingURL=catatan.controller.js.map