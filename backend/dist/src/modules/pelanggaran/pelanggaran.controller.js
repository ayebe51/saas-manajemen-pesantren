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
exports.PelanggaranController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const pelanggaran_service_1 = require("./pelanggaran.service");
const pelanggaran_dto_1 = require("./dto/pelanggaran.dto");
const jwt_auth_guard_1 = require("../../common/guards/jwt-auth.guard");
const roles_guard_1 = require("../../common/guards/roles.guard");
const roles_decorator_1 = require("../../common/decorators/roles.decorator");
const tenant_id_decorator_1 = require("../../common/decorators/tenant-id.decorator");
const audit_log_interceptor_1 = require("../../common/interceptors/audit-log.interceptor");
let PelanggaranController = class PelanggaranController {
    constructor(pelanggaranService) {
        this.pelanggaranService = pelanggaranService;
    }
    createPelanggaran(dto, tenantId, req) {
        return this.pelanggaranService.createPelanggaran(tenantId, dto, req.user.id);
    }
    findAllPelanggaran(tenantId, santriId) {
        return this.pelanggaranService.findAllPelanggaran(tenantId, santriId);
    }
    createPembinaan(dto, tenantId) {
        return this.pelanggaranService.createPembinaan(tenantId, dto);
    }
    findAllPembinaan(tenantId, santriId) {
        return this.pelanggaranService.findAllPembinaan(tenantId, santriId);
    }
};
exports.PelanggaranController = PelanggaranController;
__decorate([
    (0, common_1.Post)('pelanggaran'),
    (0, roles_decorator_1.Roles)('SUPERADMIN', 'TENANT_ADMIN', 'PENGURUS', 'MUSYRIF', 'GURU'),
    (0, common_1.UseInterceptors)(audit_log_interceptor_1.AuditLogInterceptor),
    (0, swagger_1.ApiOperation)({ summary: 'Record a new violation' }),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, tenant_id_decorator_1.TenantId)()),
    __param(2, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [pelanggaran_dto_1.CreatePelanggaranDto, String, Object]),
    __metadata("design:returntype", void 0)
], PelanggaranController.prototype, "createPelanggaran", null);
__decorate([
    (0, common_1.Get)('pelanggaran'),
    (0, swagger_1.ApiOperation)({ summary: 'List violations' }),
    (0, swagger_1.ApiQuery)({ name: 'santriId', required: false }),
    __param(0, (0, tenant_id_decorator_1.TenantId)()),
    __param(1, (0, common_1.Query)('santriId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", void 0)
], PelanggaranController.prototype, "findAllPelanggaran", null);
__decorate([
    (0, common_1.Post)('pembinaan'),
    (0, roles_decorator_1.Roles)('SUPERADMIN', 'TENANT_ADMIN', 'PENGURUS', 'MUSYRIF'),
    (0, common_1.UseInterceptors)(audit_log_interceptor_1.AuditLogInterceptor),
    (0, swagger_1.ApiOperation)({ summary: 'Create a coaching/mentoring plan' }),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, tenant_id_decorator_1.TenantId)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [pelanggaran_dto_1.CreatePembinaanDto, String]),
    __metadata("design:returntype", void 0)
], PelanggaranController.prototype, "createPembinaan", null);
__decorate([
    (0, common_1.Get)('pembinaan'),
    (0, swagger_1.ApiOperation)({ summary: 'List coaching plans' }),
    (0, swagger_1.ApiQuery)({ name: 'santriId', required: false }),
    __param(0, (0, tenant_id_decorator_1.TenantId)()),
    __param(1, (0, common_1.Query)('santriId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", void 0)
], PelanggaranController.prototype, "findAllPembinaan", null);
exports.PelanggaranController = PelanggaranController = __decorate([
    (0, swagger_1.ApiTags)('Pelanggaran & Pembinaan'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, common_1.Controller)(),
    __metadata("design:paramtypes", [pelanggaran_service_1.PelanggaranService])
], PelanggaranController);
//# sourceMappingURL=pelanggaran.controller.js.map