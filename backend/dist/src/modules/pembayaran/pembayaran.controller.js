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
exports.PembayaranController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const pembayaran_service_1 = require("./pembayaran.service");
const pembayaran_dto_1 = require("./dto/pembayaran.dto");
const jwt_auth_guard_1 = require("../../common/guards/jwt-auth.guard");
const roles_guard_1 = require("../../common/guards/roles.guard");
const roles_decorator_1 = require("../../common/decorators/roles.decorator");
const tenant_id_decorator_1 = require("../../common/decorators/tenant-id.decorator");
const public_decorator_1 = require("../../common/decorators/public.decorator");
const audit_log_interceptor_1 = require("../../common/interceptors/audit-log.interceptor");
const stripe_service_1 = require("./stripe.service");
let PembayaranController = class PembayaranController {
    constructor(pembayaranService, stripeService) {
        this.pembayaranService = pembayaranService;
        this.stripeService = stripeService;
    }
    findAllInvoices(tenantId, santriId, status) {
        return this.pembayaranService.findAllInvoices(tenantId, { santriId, status });
    }
    generateInvoice(dto, tenantId) {
        return this.pembayaranService.generateInvoice(tenantId, dto);
    }
    createPaymentIntent(dto, tenantId) {
        return this.pembayaranService.createPaymentIntent(tenantId, dto);
    }
    async handleStripeWebhook(request) {
        const signature = request.headers['stripe-signature'];
        if (!signature && process.env.NODE_ENV === 'production') {
            throw new common_1.BadRequestException('Missing stripe-signature header');
        }
        let event;
        try {
            event = this.stripeService.constructEvent(request.rawBody || JSON.stringify(request.body), signature);
        }
        catch (err) {
            throw new common_1.BadRequestException(`Webhook Error: ${err.message}`);
        }
        if (event.type === 'payment_intent.succeeded') {
            const paymentIntent = event.data.object;
            await this.pembayaranService.handleSuccessfulPayment(paymentIntent.id, paymentIntent.metadata.invoiceId, paymentIntent.amount, paymentIntent.metadata.tenantId);
        }
        return { received: true };
    }
};
exports.PembayaranController = PembayaranController;
__decorate([
    (0, common_1.Get)('invoices'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiOperation)({ summary: 'Get invoices' }),
    (0, swagger_1.ApiQuery)({ name: 'santriId', required: false }),
    (0, swagger_1.ApiQuery)({ name: 'status', required: false, enum: ['UNPAID', 'PARTIAL', 'PAID', 'CANCELLED'] }),
    __param(0, (0, tenant_id_decorator_1.TenantId)()),
    __param(1, (0, common_1.Query)('santriId')),
    __param(2, (0, common_1.Query)('status')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String]),
    __metadata("design:returntype", void 0)
], PembayaranController.prototype, "findAllInvoices", null);
__decorate([
    (0, common_1.Post)('invoices'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)('SUPERADMIN', 'TENANT_ADMIN', 'PENGURUS'),
    (0, common_1.UseInterceptors)(audit_log_interceptor_1.AuditLogInterceptor),
    (0, swagger_1.ApiOperation)({ summary: 'Generate a new invoice manually' }),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, tenant_id_decorator_1.TenantId)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [pembayaran_dto_1.GenerateInvoiceDto, String]),
    __metadata("design:returntype", void 0)
], PembayaranController.prototype, "generateInvoice", null);
__decorate([
    (0, common_1.Post)('create-intent'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiOperation)({ summary: 'Create Stripe Payment Intent for an invoice' }),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, tenant_id_decorator_1.TenantId)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [pembayaran_dto_1.CreatePaymentIntentDto, String]),
    __metadata("design:returntype", void 0)
], PembayaranController.prototype, "createPaymentIntent", null);
__decorate([
    (0, common_1.Post)('webhook/stripe'),
    (0, public_decorator_1.Public)(),
    (0, swagger_1.ApiOperation)({ summary: 'Stripe webhook endpoint for payment confirmation' }),
    __param(0, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], PembayaranController.prototype, "handleStripeWebhook", null);
exports.PembayaranController = PembayaranController = __decorate([
    (0, swagger_1.ApiTags)('Pembayaran (Billing)'),
    (0, common_1.Controller)('payments'),
    __metadata("design:paramtypes", [pembayaran_service_1.PembayaranService,
        stripe_service_1.StripeService])
], PembayaranController);
//# sourceMappingURL=pembayaran.controller.js.map