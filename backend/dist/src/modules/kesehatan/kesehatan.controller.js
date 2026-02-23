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
exports.KesehatanController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const kesehatan_service_1 = require("./kesehatan.service");
const kesehatan_dto_1 = require("./dto/kesehatan.dto");
const jwt_auth_guard_1 = require("../../common/guards/jwt-auth.guard");
const roles_guard_1 = require("../../common/guards/roles.guard");
const roles_decorator_1 = require("../../common/decorators/roles.decorator");
const tenant_id_decorator_1 = require("../../common/decorators/tenant-id.decorator");
const audit_log_interceptor_1 = require("../../common/interceptors/audit-log.interceptor");
let KesehatanController = class KesehatanController {
    constructor(kesehatanService) {
        this.kesehatanService = kesehatanService;
    }
    createRecord(dto, tenantId, req) {
        return this.kesehatanService.createRecord(tenantId, dto, req.user.id);
    }
    findAllRecords(tenantId, santriId) {
        return this.kesehatanService.findAllRecords(tenantId, santriId);
    }
    createMedication(dto, tenantId) {
        return this.kesehatanService.createMedication(tenantId, dto);
    }
    markGiven(id, tenantId, req) {
        return this.kesehatanService.markMedicationGiven(id, tenantId, req.user.id);
    }
};
exports.KesehatanController = KesehatanController;
__decorate([
    (0, common_1.Post)('records'),
    (0, roles_decorator_1.Roles)('SUPERADMIN', 'TENANT_ADMIN', 'KESEHATAN', 'PENGURUS'),
    (0, common_1.UseInterceptors)(audit_log_interceptor_1.AuditLogInterceptor),
    (0, swagger_1.ApiOperation)({ summary: 'Create a new health record' }),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, tenant_id_decorator_1.TenantId)()),
    __param(2, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [kesehatan_dto_1.CreateHealthRecordDto, String, Object]),
    __metadata("design:returntype", void 0)
], KesehatanController.prototype, "createRecord", null);
__decorate([
    (0, common_1.Get)('records'),
    (0, swagger_1.ApiOperation)({ summary: 'Get health records' }),
    (0, swagger_1.ApiQuery)({ name: 'santriId', required: false }),
    __param(0, (0, tenant_id_decorator_1.TenantId)()),
    __param(1, (0, common_1.Query)('santriId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", void 0)
], KesehatanController.prototype, "findAllRecords", null);
__decorate([
    (0, common_1.Post)('medications'),
    (0, roles_decorator_1.Roles)('SUPERADMIN', 'TENANT_ADMIN', 'KESEHATAN', 'PENGURUS'),
    (0, common_1.UseInterceptors)(audit_log_interceptor_1.AuditLogInterceptor),
    (0, swagger_1.ApiOperation)({ summary: 'Schedule a medication' }),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, tenant_id_decorator_1.TenantId)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [kesehatan_dto_1.CreateMedicationDto, String]),
    __metadata("design:returntype", void 0)
], KesehatanController.prototype, "createMedication", null);
__decorate([
    (0, common_1.Post)('medications/:id/given'),
    (0, roles_decorator_1.Roles)('SUPERADMIN', 'TENANT_ADMIN', 'KESEHATAN', 'PENGURUS'),
    (0, common_1.UseInterceptors)(audit_log_interceptor_1.AuditLogInterceptor),
    (0, swagger_1.ApiOperation)({ summary: 'Mark medication as given' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, tenant_id_decorator_1.TenantId)()),
    __param(2, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, Object]),
    __metadata("design:returntype", void 0)
], KesehatanController.prototype, "markGiven", null);
exports.KesehatanController = KesehatanController = __decorate([
    (0, swagger_1.ApiTags)('Kesehatan'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, common_1.Controller)('kesehatan'),
    __metadata("design:paramtypes", [kesehatan_service_1.KesehatanService])
], KesehatanController);
//# sourceMappingURL=kesehatan.controller.js.map