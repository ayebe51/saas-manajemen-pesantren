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
exports.WalletController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const current_user_decorator_1 = require("../../common/decorators/current-user.decorator");
const roles_decorator_1 = require("../../common/decorators/roles.decorator");
const tenant_id_decorator_1 = require("../../common/decorators/tenant-id.decorator");
const api_key_guard_1 = require("../../common/guards/api-key.guard");
const jwt_auth_guard_1 = require("../../common/guards/jwt-auth.guard");
const roles_guard_1 = require("../../common/guards/roles.guard");
const tenant_guard_1 = require("../../common/guards/tenant.guard");
const wallet_dto_1 = require("./dto/wallet.dto");
const wallet_service_1 = require("./wallet.service");
let WalletController = class WalletController {
    constructor(walletService) {
        this.walletService = walletService;
    }
    async getWallet(tenantId, santriId) {
        return this.walletService.getWallet(tenantId, santriId);
    }
    async requestDeposit(tenantId, dto) {
        return this.walletService.requestDeposit(tenantId, dto);
    }
    async manualResolveDeposit(tenantId, userId, dto) {
        return this.walletService.manualResolveDeposit(tenantId, userId, dto);
    }
    async makePayment(tenantId, userId, dto) {
        return this.walletService.makePayment(tenantId, userId, dto);
    }
    async handleMootaWebhook(tenantId, payload) {
        return this.walletService.handleMootaWebhook(tenantId, payload);
    }
};
exports.WalletController = WalletController;
__decorate([
    (0, common_1.Get)('santri/:santriId'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, tenant_guard_1.TenantGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)('SUPERADMIN', 'TENANT_ADMIN', 'PENGURUS', 'WALI'),
    (0, swagger_1.ApiOperation)({ summary: 'Melihat saldo dan riwayat mutasi dompet santri' }),
    __param(0, (0, tenant_id_decorator_1.TenantId)()),
    __param(1, (0, common_1.Param)('santriId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], WalletController.prototype, "getWallet", null);
__decorate([
    (0, common_1.Post)('deposit/request'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, tenant_guard_1.TenantGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)('SUPERADMIN', 'TENANT_ADMIN', 'PENGURUS', 'WALI'),
    (0, swagger_1.ApiOperation)({ summary: 'Minta nomor tagihan Unik Top-Up (Ticket)' }),
    __param(0, (0, tenant_id_decorator_1.TenantId)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, wallet_dto_1.RequestDepositDto]),
    __metadata("design:returntype", Promise)
], WalletController.prototype, "requestDeposit", null);
__decorate([
    (0, common_1.Post)('deposit/resolve'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, tenant_guard_1.TenantGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)('SUPERADMIN', 'TENANT_ADMIN', 'PENGURUS'),
    (0, swagger_1.ApiOperation)({ summary: 'Kasir/Admin menyetujui mutasi top-up secara manual dari dasbor' }),
    __param(0, (0, tenant_id_decorator_1.TenantId)()),
    __param(1, (0, current_user_decorator_1.CurrentUser)('userId')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, wallet_dto_1.ManualResolveDepositDto]),
    __metadata("design:returntype", Promise)
], WalletController.prototype, "manualResolveDeposit", null);
__decorate([
    (0, common_1.Post)('pos/payment'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, tenant_guard_1.TenantGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)('SUPERADMIN', 'TENANT_ADMIN', 'PENGURUS'),
    (0, swagger_1.ApiOperation)({ summary: 'Kasir asrama mencatat transaksi uang keluar / Jajan' }),
    __param(0, (0, tenant_id_decorator_1.TenantId)()),
    __param(1, (0, current_user_decorator_1.CurrentUser)('userId')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, wallet_dto_1.CreatePaymentDto]),
    __metadata("design:returntype", Promise)
], WalletController.prototype, "makePayment", null);
__decorate([
    (0, common_1.Post)('webhook/moota/:tenantId'),
    (0, common_1.UseGuards)(api_key_guard_1.ApiKeyGuard),
    (0, swagger_1.ApiOperation)({
        summary: 'Endpoint rahasia menerima HTTP Push (Webhook) mutasi rekening Bank harian',
    }),
    __param(0, (0, common_1.Param)('tenantId')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Array]),
    __metadata("design:returntype", Promise)
], WalletController.prototype, "handleMootaWebhook", null);
exports.WalletController = WalletController = __decorate([
    (0, swagger_1.ApiTags)('Dompet Digital (Wallet)'),
    (0, common_1.Controller)('api/v1/wallet'),
    __metadata("design:paramtypes", [wallet_service_1.WalletService])
], WalletController);
//# sourceMappingURL=wallet.controller.js.map