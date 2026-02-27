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
var PaymentController_1;
var _a;
Object.defineProperty(exports, "__esModule", { value: true });
exports.PaymentController = void 0;
const common_1 = require("@nestjs/common");
const payment_service_1 = require("./payment.service");
const jwt_auth_guard_1 = require("../../common/guards/jwt-auth.guard");
const roles_guard_1 = require("../../common/guards/roles.guard");
const roles_decorator_1 = require("../../common/decorators/roles.decorator");
const swagger_1 = require("@nestjs/swagger");
const tenant_decorator_1 = require("../../common/decorators/tenant.decorator");
let PaymentController = PaymentController_1 = class PaymentController {
    constructor(paymentService) {
        this.paymentService = paymentService;
        this.logger = new common_1.Logger(PaymentController_1.name);
    }
    async requestTopUp(tenantId, santriId, amount) {
        return this.paymentService.createTopUpTransaction(tenantId, santriId, amount);
    }
    async midtransWebhookNotification(notificationBody) {
        this.logger.debug(`Midtrans Knocking on Webhook door...`);
        return this.paymentService.handleMidtransWebhook(notificationBody);
    }
};
exports.PaymentController = PaymentController;
__decorate([
    (0, common_1.Post)('topup/request'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)('SUPERADMIN', 'TENANT_ADMIN', 'WALI_SANTRI'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: 'Minta Tiket Pembayaran Midtrans Snap (Top Up Dompet)' }),
    (0, swagger_1.ApiBody)({ schema: { example: { santriId: 'uuid', amount: 50000 } } }),
    __param(0, (0, tenant_decorator_1.TenantId)()),
    __param(1, (0, common_1.Body)('santriId')),
    __param(2, (0, common_1.Body)('amount')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, Number]),
    __metadata("design:returntype", Promise)
], PaymentController.prototype, "requestTopUp", null);
__decorate([
    (0, common_1.Post)('midtrans/webhook'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, swagger_1.ApiOperation)({ summary: 'Webhook Listener Pembayaran Midtrans (Otomatis Panggil by System)' }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], PaymentController.prototype, "midtransWebhookNotification", null);
exports.PaymentController = PaymentController = PaymentController_1 = __decorate([
    (0, swagger_1.ApiTags)('Payments (Midtrans)'),
    (0, common_1.Controller)('api/v1/payments'),
    __metadata("design:paramtypes", [typeof (_a = typeof payment_service_1.PaymentService !== "undefined" && payment_service_1.PaymentService) === "function" ? _a : Object])
], PaymentController);
//# sourceMappingURL=payment.controller.js.map