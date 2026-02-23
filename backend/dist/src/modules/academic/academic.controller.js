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
exports.AcademicController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const current_user_decorator_1 = require("../../common/decorators/current-user.decorator");
const roles_decorator_1 = require("../../common/decorators/roles.decorator");
const tenant_id_decorator_1 = require("../../common/decorators/tenant-id.decorator");
const jwt_auth_guard_1 = require("../../common/guards/jwt-auth.guard");
const roles_guard_1 = require("../../common/guards/roles.guard");
const tenant_guard_1 = require("../../common/guards/tenant.guard");
const academic_service_1 = require("./academic.service");
const academic_dto_1 = require("./dto/academic.dto");
let AcademicController = class AcademicController {
    constructor(academicService) {
        this.academicService = academicService;
    }
    async createSchedule(tenantId, dto) {
        return this.academicService.createSchedule(tenantId, dto);
    }
    async getSchedule(tenantId, kelas) {
        return this.academicService.getScheduleByKelas(tenantId, kelas);
    }
    async recordAttendance(tenantId, userId, dto) {
        return this.academicService.recordAttendance(tenantId, userId, dto);
    }
    async getAttendance(tenantId, santriId) {
        return this.academicService.getAttendanceReport(tenantId, santriId);
    }
    async createGrade(tenantId, dto) {
        return this.academicService.createGrade(tenantId, dto);
    }
    async getGrade(tenantId, santriId, semester, academicYear) {
        return this.academicService.getGradeReport(tenantId, santriId, semester, academicYear);
    }
};
exports.AcademicController = AcademicController;
__decorate([
    (0, common_1.Post)('schedule'),
    (0, roles_decorator_1.Roles)('SUPERADMIN', 'TENANT_ADMIN', 'PENGURUS'),
    (0, swagger_1.ApiOperation)({ summary: 'Membuat jadwal pelajaran baru' }),
    __param(0, (0, tenant_id_decorator_1.TenantId)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, academic_dto_1.CreateScheduleDto]),
    __metadata("design:returntype", Promise)
], AcademicController.prototype, "createSchedule", null);
__decorate([
    (0, common_1.Get)('schedule/kelas/:kelas'),
    (0, roles_decorator_1.Roles)('SUPERADMIN', 'TENANT_ADMIN', 'PENGURUS', 'GURU', 'WALI', 'SANTRI'),
    (0, swagger_1.ApiOperation)({ summary: 'Melihat jadwal lengkap pelajaran 1 kelas' }),
    __param(0, (0, tenant_id_decorator_1.TenantId)()),
    __param(1, (0, common_1.Param)('kelas')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], AcademicController.prototype, "getSchedule", null);
__decorate([
    (0, common_1.Post)('attendance'),
    (0, roles_decorator_1.Roles)('SUPERADMIN', 'TENANT_ADMIN', 'PENGURUS', 'GURU'),
    (0, swagger_1.ApiOperation)({ summary: 'Mencatat presensi santri sekolah (Bulk/Satu Kelas)' }),
    __param(0, (0, tenant_id_decorator_1.TenantId)()),
    __param(1, (0, current_user_decorator_1.CurrentUser)('userId')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, academic_dto_1.CreateBulkAttendanceDto]),
    __metadata("design:returntype", Promise)
], AcademicController.prototype, "recordAttendance", null);
__decorate([
    (0, common_1.Get)('attendance/santri/:santriId'),
    (0, roles_decorator_1.Roles)('SUPERADMIN', 'TENANT_ADMIN', 'PENGURUS', 'GURU', 'WALI'),
    (0, swagger_1.ApiOperation)({ summary: 'Melihat rekap riwayat presensi satu orang santri' }),
    __param(0, (0, tenant_id_decorator_1.TenantId)()),
    __param(1, (0, common_1.Param)('santriId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], AcademicController.prototype, "getAttendance", null);
__decorate([
    (0, common_1.Post)('grade'),
    (0, roles_decorator_1.Roles)('SUPERADMIN', 'TENANT_ADMIN', 'PENGURUS', 'GURU'),
    (0, swagger_1.ApiOperation)({ summary: 'Memasukkan data nilai prestasi / rapor santri' }),
    __param(0, (0, tenant_id_decorator_1.TenantId)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, academic_dto_1.CreateGradeDto]),
    __metadata("design:returntype", Promise)
], AcademicController.prototype, "createGrade", null);
__decorate([
    (0, common_1.Get)('grade/santri/:santriId'),
    (0, roles_decorator_1.Roles)('SUPERADMIN', 'TENANT_ADMIN', 'PENGURUS', 'GURU', 'WALI'),
    (0, swagger_1.ApiQuery)({ name: 'semester', required: false, description: 'Filter by GANJIL/GENAP' }),
    (0, swagger_1.ApiQuery)({ name: 'academicYear', required: false, description: 'Filter by year e.g 2024/2025' }),
    (0, swagger_1.ApiOperation)({ summary: 'Melihat histori nilai rapor sekolah santri' }),
    __param(0, (0, tenant_id_decorator_1.TenantId)()),
    __param(1, (0, common_1.Param)('santriId')),
    __param(2, (0, common_1.Query)('semester')),
    __param(3, (0, common_1.Query)('academicYear')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String, String]),
    __metadata("design:returntype", Promise)
], AcademicController.prototype, "getGrade", null);
exports.AcademicController = AcademicController = __decorate([
    (0, swagger_1.ApiTags)('Akademik & Rapor'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, tenant_guard_1.TenantGuard, roles_guard_1.RolesGuard),
    (0, common_1.Controller)('api/v1/academic'),
    __metadata("design:paramtypes", [academic_service_1.AcademicService])
], AcademicController);
//# sourceMappingURL=academic.controller.js.map