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
exports.SantriController = void 0;
const common_1 = require("@nestjs/common");
const platform_express_1 = require("@nestjs/platform-express");
const swagger_1 = require("@nestjs/swagger");
const santri_service_1 = require("./santri.service");
const santri_dto_1 = require("./dto/santri.dto");
const jwt_auth_guard_1 = require("../../common/guards/jwt-auth.guard");
const roles_guard_1 = require("../../common/guards/roles.guard");
const roles_decorator_1 = require("../../common/decorators/roles.decorator");
const tenant_id_decorator_1 = require("../../common/decorators/tenant-id.decorator");
const audit_log_interceptor_1 = require("../../common/interceptors/audit-log.interceptor");
let SantriController = class SantriController {
    constructor(santriService) {
        this.santriService = santriService;
    }
    create(createSantriDto, tenantId) {
        return this.santriService.create(tenantId, createSantriDto);
    }
    async bulkImport(file, tenantId) {
        return this.santriService.bulkImport(tenantId, file);
    }
    findAll(tenantId, kelas, room) {
        return this.santriService.findAll(tenantId, { kelas, room });
    }
    findOne(id, tenantId) {
        return this.santriService.findOne(id, tenantId);
    }
    update(id, updateSantriDto, tenantId) {
        return this.santriService.update(id, tenantId, updateSantriDto);
    }
    addWali(santriId, createWaliDto, tenantId) {
        return this.santriService.addWali(santriId, tenantId, createWaliDto);
    }
    linkExistingWali(santriId, waliId, tenantId) {
        return this.santriService.linkWali(santriId, waliId, tenantId);
    }
};
exports.SantriController = SantriController;
__decorate([
    (0, common_1.Post)(),
    (0, roles_decorator_1.Roles)('SUPERADMIN', 'TENANT_ADMIN', 'PENGURUS'),
    (0, swagger_1.ApiOperation)({ summary: 'Create a new santri' }),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, tenant_id_decorator_1.TenantId)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [santri_dto_1.CreateSantriDto, String]),
    __metadata("design:returntype", void 0)
], SantriController.prototype, "create", null);
__decorate([
    (0, common_1.Post)('import/bulk'),
    (0, roles_decorator_1.Roles)('SUPERADMIN', 'TENANT_ADMIN'),
    (0, swagger_1.ApiOperation)({ summary: 'Bulk Create/Import Santri via Excel File' }),
    (0, swagger_1.ApiConsumes)('multipart/form-data'),
    (0, swagger_1.ApiBody)({
        schema: {
            type: 'object',
            properties: {
                file: {
                    type: 'string',
                    format: 'binary',
                },
            },
        },
    }),
    (0, common_1.UseInterceptors)((0, platform_express_1.FileInterceptor)('file')),
    __param(0, (0, common_1.UploadedFile)()),
    __param(1, (0, tenant_id_decorator_1.TenantId)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], SantriController.prototype, "bulkImport", null);
__decorate([
    (0, common_1.Get)(),
    (0, swagger_1.ApiOperation)({ summary: 'Get all santri for current tenant' }),
    (0, swagger_1.ApiQuery)({ name: 'kelas', required: false }),
    (0, swagger_1.ApiQuery)({ name: 'room', required: false }),
    __param(0, (0, tenant_id_decorator_1.TenantId)()),
    __param(1, (0, common_1.Query)('kelas')),
    __param(2, (0, common_1.Query)('room')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String]),
    __metadata("design:returntype", void 0)
], SantriController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)(':id'),
    (0, swagger_1.ApiOperation)({ summary: 'Get santri details with wali info' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, tenant_id_decorator_1.TenantId)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", void 0)
], SantriController.prototype, "findOne", null);
__decorate([
    (0, common_1.Put)(':id'),
    (0, roles_decorator_1.Roles)('SUPERADMIN', 'TENANT_ADMIN', 'PENGURUS'),
    (0, swagger_1.ApiOperation)({ summary: 'Update santri' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, tenant_id_decorator_1.TenantId)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, santri_dto_1.UpdateSantriDto, String]),
    __metadata("design:returntype", void 0)
], SantriController.prototype, "update", null);
__decorate([
    (0, common_1.Post)(':id/wali'),
    (0, roles_decorator_1.Roles)('SUPERADMIN', 'TENANT_ADMIN', 'PENGURUS'),
    (0, swagger_1.ApiOperation)({ summary: 'Add a new wali and link to santri' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, tenant_id_decorator_1.TenantId)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, santri_dto_1.CreateWaliDto, String]),
    __metadata("design:returntype", void 0)
], SantriController.prototype, "addWali", null);
__decorate([
    (0, common_1.Post)(':id/wali/:waliId/link'),
    (0, roles_decorator_1.Roles)('SUPERADMIN', 'TENANT_ADMIN', 'PENGURUS'),
    (0, swagger_1.ApiOperation)({ summary: 'Link an existing wali to this santri' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Param)('waliId')),
    __param(2, (0, tenant_id_decorator_1.TenantId)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String]),
    __metadata("design:returntype", void 0)
], SantriController.prototype, "linkExistingWali", null);
exports.SantriController = SantriController = __decorate([
    (0, swagger_1.ApiTags)('Santri'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, common_1.UseInterceptors)(audit_log_interceptor_1.AuditLogInterceptor),
    (0, common_1.Controller)('santri'),
    __metadata("design:paramtypes", [santri_service_1.SantriService])
], SantriController);
//# sourceMappingURL=santri.controller.js.map