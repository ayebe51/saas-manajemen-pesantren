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
exports.TahfidzController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const current_user_decorator_1 = require("../../common/decorators/current-user.decorator");
const roles_decorator_1 = require("../../common/decorators/roles.decorator");
const tenant_id_decorator_1 = require("../../common/decorators/tenant-id.decorator");
const jwt_auth_guard_1 = require("../../common/guards/jwt-auth.guard");
const roles_guard_1 = require("../../common/guards/roles.guard");
const tenant_guard_1 = require("../../common/guards/tenant.guard");
const tahfidz_dto_1 = require("./dto/tahfidz.dto");
const tahfidz_service_1 = require("./tahfidz.service");
let TahfidzController = class TahfidzController {
    constructor(tahfidzService) {
        this.tahfidzService = tahfidzService;
    }
    async createTahfidz(tenantId, userId, dto) {
        return this.tahfidzService.createTahfidz(tenantId, userId, dto);
    }
    async getTahfidzHistory(tenantId, santriId) {
        return this.tahfidzService.getTahfidzBySantri(tenantId, santriId);
    }
    async getAllTahfidzHistory(tenantId) {
        return this.tahfidzService.getTahfidzAllSantri(tenantId);
    }
    async createMutabaah(tenantId, userId, dto) {
        return this.tahfidzService.createOrUpdateMutabaah(tenantId, userId, dto);
    }
    async getMutabaahHistory(tenantId, santriId) {
        return this.tahfidzService.getMutabaahBySantri(tenantId, santriId);
    }
};
exports.TahfidzController = TahfidzController;
__decorate([
    (0, common_1.Post)(),
    (0, roles_decorator_1.Roles)('SUPERADMIN', 'TENANT_ADMIN', 'PENGURUS', 'GURU', 'MUSYRIF'),
    (0, swagger_1.ApiOperation)({ summary: 'Mencatat setoran tahfidz santri' }),
    __param(0, (0, tenant_id_decorator_1.TenantId)()),
    __param(1, (0, current_user_decorator_1.CurrentUser)('userId')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, tahfidz_dto_1.CreateTahfidzDto]),
    __metadata("design:returntype", Promise)
], TahfidzController.prototype, "createTahfidz", null);
__decorate([
    (0, common_1.Get)('santri/:santriId'),
    (0, roles_decorator_1.Roles)('SUPERADMIN', 'TENANT_ADMIN', 'PENGURUS', 'GURU', 'MUSYRIF', 'WALI'),
    (0, swagger_1.ApiOperation)({ summary: 'Melihat riwayat hafalan santri' }),
    __param(0, (0, tenant_id_decorator_1.TenantId)()),
    __param(1, (0, common_1.Param)('santriId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], TahfidzController.prototype, "getTahfidzHistory", null);
__decorate([
    (0, common_1.Get)(),
    (0, roles_decorator_1.Roles)('SUPERADMIN', 'TENANT_ADMIN', 'PENGURUS', 'GURU', 'MUSYRIF'),
    (0, swagger_1.ApiOperation)({ summary: 'Melihat riwayat hafalan seluruh santri' }),
    __param(0, (0, tenant_id_decorator_1.TenantId)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], TahfidzController.prototype, "getAllTahfidzHistory", null);
__decorate([
    (0, common_1.Post)('mutabaah'),
    (0, roles_decorator_1.Roles)('SUPERADMIN', 'TENANT_ADMIN', 'PENGURUS', 'GURU', 'MUSYRIF'),
    (0, swagger_1.ApiOperation)({ summary: 'Mencatat kegiatan harian (mutabaah) santri' }),
    __param(0, (0, tenant_id_decorator_1.TenantId)()),
    __param(1, (0, current_user_decorator_1.CurrentUser)('userId')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, tahfidz_dto_1.CreateMutabaahDto]),
    __metadata("design:returntype", Promise)
], TahfidzController.prototype, "createMutabaah", null);
__decorate([
    (0, common_1.Get)('mutabaah/santri/:santriId'),
    (0, roles_decorator_1.Roles)('SUPERADMIN', 'TENANT_ADMIN', 'PENGURUS', 'GURU', 'MUSYRIF', 'WALI'),
    (0, swagger_1.ApiOperation)({ summary: 'Melihat riwayat mutabaah 30 hari terakhir santri' }),
    __param(0, (0, tenant_id_decorator_1.TenantId)()),
    __param(1, (0, common_1.Param)('santriId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], TahfidzController.prototype, "getMutabaahHistory", null);
exports.TahfidzController = TahfidzController = __decorate([
    (0, swagger_1.ApiTags)('Tahfidz & Mutabaah'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, tenant_guard_1.TenantGuard, roles_guard_1.RolesGuard),
    (0, common_1.Controller)('api/v1/tahfidz'),
    __metadata("design:paramtypes", [tahfidz_service_1.TahfidzService])
], TahfidzController);
//# sourceMappingURL=tahfidz.controller.js.map