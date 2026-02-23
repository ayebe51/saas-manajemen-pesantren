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
exports.DormitoryController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const dormitory_service_1 = require("./dormitory.service");
const dormitory_dto_1 = require("./dto/dormitory.dto");
const jwt_auth_guard_1 = require("../../common/guards/jwt-auth.guard");
const roles_guard_1 = require("../../common/guards/roles.guard");
const tenant_guard_1 = require("../../common/guards/tenant.guard");
const roles_decorator_1 = require("../../common/decorators/roles.decorator");
const tenant_id_decorator_1 = require("../../common/decorators/tenant-id.decorator");
const current_user_decorator_1 = require("../../common/decorators/current-user.decorator");
let DormitoryController = class DormitoryController {
    constructor(dormitoryService) {
        this.dormitoryService = dormitoryService;
    }
    createBuilding(tenantId, dto) {
        return this.dormitoryService.createBuilding(tenantId, dto);
    }
    findAllBuildings(tenantId) {
        return this.dormitoryService.findAllBuildings(tenantId);
    }
    updateBuilding(tenantId, id, dto) {
        return this.dormitoryService.updateBuilding(tenantId, id, dto);
    }
    createRoom(tenantId, dto) {
        return this.dormitoryService.createRoom(tenantId, dto);
    }
    findAllRooms(tenantId, buildingId) {
        return this.dormitoryService.findAllRooms(tenantId, buildingId);
    }
    updateRoom(tenantId, id, dto) {
        return this.dormitoryService.updateRoom(tenantId, id, dto);
    }
    assignRoom(tenantId, roomId, dto) {
        return this.dormitoryService.assignRoom(tenantId, roomId, dto);
    }
    checkoutRoom(tenantId, assignmentId, dto) {
        return this.dormitoryService.checkoutRoom(tenantId, assignmentId, dto);
    }
    createTicket(tenantId, dto, user) {
        return this.dormitoryService.createTicket(tenantId, dto, user.userId);
    }
    findAllTickets(tenantId, status) {
        return this.dormitoryService.findAllTickets(tenantId, status);
    }
    updateTicket(tenantId, id, dto) {
        return this.dormitoryService.updateTicket(tenantId, id, dto);
    }
};
exports.DormitoryController = DormitoryController;
__decorate([
    (0, common_1.Post)('buildings'),
    (0, roles_decorator_1.Roles)('SUPERADMIN', 'TENANT_ADMIN', 'PENGURUS'),
    (0, swagger_1.ApiOperation)({ summary: 'Mendaftarkan Gedung Asrama Baru' }),
    __param(0, (0, tenant_id_decorator_1.TenantId)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, dormitory_dto_1.CreateBuildingDto]),
    __metadata("design:returntype", void 0)
], DormitoryController.prototype, "createBuilding", null);
__decorate([
    (0, common_1.Get)('buildings'),
    (0, roles_decorator_1.Roles)('SUPERADMIN', 'TENANT_ADMIN', 'PENGURUS', 'MUSYRIF'),
    (0, swagger_1.ApiOperation)({ summary: 'List Data Gedung Asrama berserta jumlah kamar' }),
    __param(0, (0, tenant_id_decorator_1.TenantId)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], DormitoryController.prototype, "findAllBuildings", null);
__decorate([
    (0, common_1.Put)('buildings/:id'),
    (0, roles_decorator_1.Roles)('SUPERADMIN', 'TENANT_ADMIN', 'PENGURUS'),
    (0, swagger_1.ApiOperation)({ summary: 'Mengedit data gedung' }),
    __param(0, (0, tenant_id_decorator_1.TenantId)()),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, dormitory_dto_1.UpdateBuildingDto]),
    __metadata("design:returntype", void 0)
], DormitoryController.prototype, "updateBuilding", null);
__decorate([
    (0, common_1.Post)('rooms'),
    (0, roles_decorator_1.Roles)('SUPERADMIN', 'TENANT_ADMIN', 'PENGURUS'),
    (0, swagger_1.ApiOperation)({ summary: 'Membuat kamar baru di dalam sebuah Gedung' }),
    __param(0, (0, tenant_id_decorator_1.TenantId)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, dormitory_dto_1.CreateRoomDto]),
    __metadata("design:returntype", void 0)
], DormitoryController.prototype, "createRoom", null);
__decorate([
    (0, common_1.Get)('rooms'),
    (0, roles_decorator_1.Roles)('SUPERADMIN', 'TENANT_ADMIN', 'PENGURUS', 'MUSYRIF'),
    (0, swagger_1.ApiOperation)({ summary: 'List Kamar Asrama (Bisa filter by BuildingId)' }),
    (0, swagger_1.ApiQuery)({ name: 'buildingId', required: false }),
    __param(0, (0, tenant_id_decorator_1.TenantId)()),
    __param(1, (0, common_1.Query)('buildingId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", void 0)
], DormitoryController.prototype, "findAllRooms", null);
__decorate([
    (0, common_1.Put)('rooms/:id'),
    (0, roles_decorator_1.Roles)('SUPERADMIN', 'TENANT_ADMIN', 'PENGURUS'),
    (0, swagger_1.ApiOperation)({ summary: 'Mengedit kapasitas atau penanggung jawab Kamar' }),
    __param(0, (0, tenant_id_decorator_1.TenantId)()),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, dormitory_dto_1.UpdateRoomDto]),
    __metadata("design:returntype", void 0)
], DormitoryController.prototype, "updateRoom", null);
__decorate([
    (0, common_1.Post)('rooms/:roomId/assign'),
    (0, roles_decorator_1.Roles)('SUPERADMIN', 'TENANT_ADMIN', 'PENGURUS', 'MUSYRIF'),
    (0, swagger_1.ApiOperation)({ summary: 'Menautkan (Assign) Santri ke Kamar tertentu' }),
    __param(0, (0, tenant_id_decorator_1.TenantId)()),
    __param(1, (0, common_1.Param)('roomId')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, dormitory_dto_1.AssignRoomDto]),
    __metadata("design:returntype", void 0)
], DormitoryController.prototype, "assignRoom", null);
__decorate([
    (0, common_1.Put)('assignments/:assignmentId/checkout'),
    (0, roles_decorator_1.Roles)('SUPERADMIN', 'TENANT_ADMIN', 'PENGURUS', 'MUSYRIF'),
    (0, swagger_1.ApiOperation)({ summary: 'Mencabut (Checkout) status Santri dari Kamar (Mutasi/Lulus)' }),
    __param(0, (0, tenant_id_decorator_1.TenantId)()),
    __param(1, (0, common_1.Param)('assignmentId')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, dormitory_dto_1.CheckoutRoomDto]),
    __metadata("design:returntype", void 0)
], DormitoryController.prototype, "checkoutRoom", null);
__decorate([
    (0, common_1.Post)('tickets'),
    (0, roles_decorator_1.Roles)('SUPERADMIN', 'TENANT_ADMIN', 'PENGURUS', 'MUSYRIF', 'SANTRI'),
    (0, swagger_1.ApiOperation)({ summary: 'Membuat Laporan Kerusakan fasilitas (Kran Patah, etc)' }),
    __param(0, (0, tenant_id_decorator_1.TenantId)()),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, dormitory_dto_1.CreateMaintenanceTicketDto, Object]),
    __metadata("design:returntype", void 0)
], DormitoryController.prototype, "createTicket", null);
__decorate([
    (0, common_1.Get)('tickets'),
    (0, roles_decorator_1.Roles)('SUPERADMIN', 'TENANT_ADMIN', 'PENGURUS', 'MUSYRIF'),
    (0, swagger_1.ApiOperation)({ summary: 'Melihat list laporan kerusakan asrama' }),
    (0, swagger_1.ApiQuery)({ name: 'status', required: false, description: 'OPEN, IN_PROGRESS, RESOLVED' }),
    __param(0, (0, tenant_id_decorator_1.TenantId)()),
    __param(1, (0, common_1.Query)('status')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", void 0)
], DormitoryController.prototype, "findAllTickets", null);
__decorate([
    (0, common_1.Put)('tickets/:id'),
    (0, roles_decorator_1.Roles)('SUPERADMIN', 'TENANT_ADMIN', 'PENGURUS'),
    (0, swagger_1.ApiOperation)({ summary: 'Update status pengerjaan Maintenance' }),
    __param(0, (0, tenant_id_decorator_1.TenantId)()),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, dormitory_dto_1.UpdateMaintenanceTicketDto]),
    __metadata("design:returntype", void 0)
], DormitoryController.prototype, "updateTicket", null);
exports.DormitoryController = DormitoryController = __decorate([
    (0, swagger_1.ApiTags)('Manajemen Asrama'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, tenant_guard_1.TenantGuard, roles_guard_1.RolesGuard),
    (0, common_1.Controller)('api/v1/dormitory'),
    __metadata("design:paramtypes", [dormitory_service_1.DormitoryService])
], DormitoryController);
//# sourceMappingURL=dormitory.controller.js.map