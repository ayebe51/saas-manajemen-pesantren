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
exports.KunjunganController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const kunjungan_service_1 = require("./kunjungan.service");
const kunjungan_dto_1 = require("./dto/kunjungan.dto");
const jwt_auth_guard_1 = require("../../common/guards/jwt-auth.guard");
const roles_guard_1 = require("../../common/guards/roles.guard");
const roles_decorator_1 = require("../../common/decorators/roles.decorator");
const tenant_id_decorator_1 = require("../../common/decorators/tenant-id.decorator");
const audit_log_interceptor_1 = require("../../common/interceptors/audit-log.interceptor");
let KunjunganController = class KunjunganController {
    constructor(kunjunganService) {
        this.kunjunganService = kunjunganService;
    }
    create(dto, tenantId) {
        return this.kunjunganService.create(tenantId, dto);
    }
    findAll(tenantId, date, santriId) {
        return this.kunjunganService.findAll(tenantId, { date, santriId });
    }
    getSlots(tenantId, date) {
        return this.kunjunganService.getAvailableSlots(tenantId, date);
    }
    checkin(id, tenantId, visitorName) {
        return this.kunjunganService.checkin(id, tenantId, visitorName);
    }
};
exports.KunjunganController = KunjunganController;
__decorate([
    (0, common_1.Post)(),
    (0, roles_decorator_1.Roles)('SUPERADMIN', 'TENANT_ADMIN', 'PENGURUS'),
    (0, common_1.UseInterceptors)(audit_log_interceptor_1.AuditLogInterceptor),
    (0, swagger_1.ApiOperation)({ summary: 'Book a new visit' }),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, tenant_id_decorator_1.TenantId)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [kunjungan_dto_1.CreateKunjunganDto, String]),
    __metadata("design:returntype", void 0)
], KunjunganController.prototype, "create", null);
__decorate([
    (0, common_1.Get)(),
    (0, swagger_1.ApiOperation)({ summary: 'List visits' }),
    (0, swagger_1.ApiQuery)({ name: 'date', required: false, description: 'YYYY-MM-DD' }),
    (0, swagger_1.ApiQuery)({ name: 'santriId', required: false }),
    __param(0, (0, tenant_id_decorator_1.TenantId)()),
    __param(1, (0, common_1.Query)('date')),
    __param(2, (0, common_1.Query)('santriId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String]),
    __metadata("design:returntype", void 0)
], KunjunganController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)('slots'),
    (0, swagger_1.ApiOperation)({ summary: 'Get available slots for a specific date' }),
    (0, swagger_1.ApiQuery)({ name: 'date', required: true, description: 'YYYY-MM-DD' }),
    __param(0, (0, tenant_id_decorator_1.TenantId)()),
    __param(1, (0, common_1.Query)('date')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", void 0)
], KunjunganController.prototype, "getSlots", null);
__decorate([
    (0, common_1.Post)(':id/checkin'),
    (0, roles_decorator_1.Roles)('SUPERADMIN', 'TENANT_ADMIN', 'PENGURUS'),
    (0, common_1.UseInterceptors)(audit_log_interceptor_1.AuditLogInterceptor),
    (0, swagger_1.ApiOperation)({ summary: 'Check in a visitor (Scan QR)' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, tenant_id_decorator_1.TenantId)()),
    __param(2, (0, common_1.Body)('visitorName')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String]),
    __metadata("design:returntype", void 0)
], KunjunganController.prototype, "checkin", null);
exports.KunjunganController = KunjunganController = __decorate([
    (0, swagger_1.ApiTags)('Kunjungan Wali (Visits)'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, common_1.Controller)('kunjungan'),
    __metadata("design:paramtypes", [kunjungan_service_1.KunjunganService])
], KunjunganController);
//# sourceMappingURL=kunjungan.controller.js.map