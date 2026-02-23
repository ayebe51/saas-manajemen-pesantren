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
var StripeService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.StripeService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const stripe_1 = require("stripe");
let StripeService = StripeService_1 = class StripeService {
    constructor(configService) {
        this.configService = configService;
        this.logger = new common_1.Logger(StripeService_1.name);
        const secretKey = this.configService.get('STRIPE_SECRET_KEY');
        if (!secretKey || secretKey.startsWith('mock_')) {
            this.logger.warn('Stripe is running in mock mode. No real transactions will occur.');
            this.stripe = null;
        }
        else {
            this.stripe = new stripe_1.default(secretKey, {
                apiVersion: '2023-10-16',
            });
        }
    }
    async createPaymentIntent(amount, currency = 'idr', metadata = {}) {
        if (!this.stripe) {
            return {
                id: `pi_mock_${Date.now()}`,
                client_secret: `client_secret_mock_${Date.now()}`,
                status: 'requires_payment_method'
            };
        }
        try {
            return await this.stripe.paymentIntents.create({
                amount,
                currency,
                metadata,
                payment_method_types: ['card', 'alipay'],
            });
        }
        catch (error) {
            this.logger.error(`Failed to create Stripe payment intent: ${error.message}`);
            throw error;
        }
    }
    constructEvent(payload, signature) {
        if (!this.stripe) {
            const parsed = JSON.parse(payload.toString());
            return {
                id: parsed.id || 'evt_mock',
                type: parsed.type || 'payment_intent.succeeded',
                data: parsed.data || {}
            };
        }
        const webhookSecret = this.configService.get('STRIPE_WEBHOOK_SECRET') || '';
        return this.stripe.webhooks.constructEvent(payload, signature, webhookSecret);
    }
};
exports.StripeService = StripeService;
exports.StripeService = StripeService = StripeService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService])
], StripeService);
//# sourceMappingURL=stripe.service.js.map