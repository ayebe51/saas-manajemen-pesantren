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
exports.PpdbController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const ppdb_service_1 = require("./ppdb.service");
const ppdb_dto_1 = require("./dto/ppdb.dto");
const jwt_auth_guard_1 = require("../../common/guards/jwt-auth.guard");
const roles_guard_1 = require("../../common/guards/roles.guard");
const tenant_guard_1 = require("../../common/guards/tenant.guard");
const roles_decorator_1 = require("../../common/decorators/roles.decorator");
const tenant_id_decorator_1 = require("../../common/decorators/tenant-id.decorator");
let PpdbController = class PpdbController {
    constructor(ppdbService) {
        this.ppdbService = ppdbService;
    }
    create(tenantId, createPpdbDto) {
        return this.ppdbService.create(tenantId, createPpdbDto);
    }
    findAll(tenantId, status) {
        return this.ppdbService.findAll(tenantId, status);
    }
    findOne(tenantId, id) {
        return this.ppdbService.findOne(tenantId, id);
    }
    update(tenantId, id, updatePpdbDto) {
        return this.ppdbService.update(tenantId, id, updatePpdbDto);
    }
    addDocument(tenantId, registrationId, addDocDto) {
        return this.ppdbService.addDocument(tenantId, registrationId, addDocDto);
    }
    addExam(tenantId, registrationId, addExamDto) {
        return this.ppdbService.addExam(tenantId, registrationId, addExamDto);
    }
};
exports.PpdbController = PpdbController;
__decorate([
    (0, common_1.Post)(),
    (0, roles_decorator_1.Roles)('SUPERADMIN', 'TENANT_ADMIN', 'PENGURUS'),
    (0, swagger_1.ApiOperation)({ summary: 'Mendaftarkan calon santri baru' }),
    __param(0, (0, tenant_id_decorator_1.TenantId)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, ppdb_dto_1.CreatePpdbDto]),
    __metadata("design:returntype", void 0)
], PpdbController.prototype, "create", null);
__decorate([
    (0, common_1.Get)(),
    (0, roles_decorator_1.Roles)('SUPERADMIN', 'TENANT_ADMIN', 'PENGURUS'),
    (0, swagger_1.ApiOperation)({ summary: 'Melihat seluruh daftar pendaftar PPDB' }),
    (0, swagger_1.ApiQuery)({
        name: 'status',
        required: false,
        description: 'Filter by status (e.g PENDING, ACCEPTED)',
    }),
    __param(0, (0, tenant_id_decorator_1.TenantId)()),
    __param(1, (0, common_1.Query)('status')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", void 0)
], PpdbController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)(':id'),
    (0, roles_decorator_1.Roles)('SUPERADMIN', 'TENANT_ADMIN', 'PENGURUS'),
    (0, swagger_1.ApiOperation)({ summary: 'Melihat detail pendaftar PPDB beserta dokumen dan hasil tes' }),
    __param(0, (0, tenant_id_decorator_1.TenantId)()),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", void 0)
], PpdbController.prototype, "findOne", null);
__decorate([
    (0, common_1.Put)(':id'),
    (0, roles_decorator_1.Roles)('SUPERADMIN', 'TENANT_ADMIN', 'PENGURUS'),
    (0, swagger_1.ApiOperation)({ summary: 'Mengubah status pendaftaran atau profil calon santri' }),
    __param(0, (0, tenant_id_decorator_1.TenantId)()),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, ppdb_dto_1.UpdatePpdbDto]),
    __metadata("design:returntype", void 0)
], PpdbController.prototype, "update", null);
__decorate([
    (0, common_1.Post)(':id/documents'),
    (0, roles_decorator_1.Roles)('SUPERADMIN', 'TENANT_ADMIN', 'PENGURUS'),
    (0, swagger_1.ApiOperation)({ summary: 'Melampirkan dokumen persyaratan pendaftar (KK, Ijazah)' }),
    __param(0, (0, tenant_id_decorator_1.TenantId)()),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, ppdb_dto_1.AddPpdbDocumentDto]),
    __metadata("design:returntype", void 0)
], PpdbController.prototype, "addDocument", null);
__decorate([
    (0, common_1.Post)(':id/exams'),
    (0, roles_decorator_1.Roles)('SUPERADMIN', 'TENANT_ADMIN', 'PENGURUS'),
    (0, swagger_1.ApiOperation)({ summary: 'Menginput jadwal atau nilai tes masuk (Wawancara, Tulis, Ngaji)' }),
    __param(0, (0, tenant_id_decorator_1.TenantId)()),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, ppdb_dto_1.AddPpdbExamDto]),
    __metadata("design:returntype", void 0)
], PpdbController.prototype, "addExam", null);
exports.PpdbController = PpdbController = __decorate([
    (0, swagger_1.ApiTags)('PPDB (Penerimaan Siswa Baru)'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, tenant_guard_1.TenantGuard, roles_guard_1.RolesGuard),
    (0, common_1.Controller)('api/v1/ppdb'),
    __metadata("design:paramtypes", [ppdb_service_1.PpdbService])
], PpdbController);
//# sourceMappingURL=ppdb.controller.js.map