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
var WebhookController_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.WebhookController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const whatsapp_webhook_service_1 = require("../notification/whatsapp-webhook.service");
let WebhookController = WebhookController_1 = class WebhookController {
    constructor(waWebhookService) {
        this.waWebhookService = waWebhookService;
        this.logger = new common_1.Logger(WebhookController_1.name);
    }
    async receiveWhatsappMessage(payload) {
        this.logger.log('Incoming WhatsApp Webhook Hit');
        this.waWebhookService.handleIncomingMessage(payload).catch((err) => {
            this.logger.error(`Error processing webhook: ${err.message}`);
        });
        return { status: 'Received' };
    }
};
exports.WebhookController = WebhookController;
__decorate([
    (0, common_1.Post)('whatsapp'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, swagger_1.ApiOperation)({ summary: 'Receive Forwarded/Incoming WhatsApp Messages from Provider' }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], WebhookController.prototype, "receiveWhatsappMessage", null);
exports.WebhookController = WebhookController = WebhookController_1 = __decorate([
    (0, swagger_1.ApiTags)('Public & Integrations'),
    (0, common_1.Controller)('webhook'),
    __metadata("design:paramtypes", [whatsapp_webhook_service_1.WhatsappWebhookService])
], WebhookController);
//# sourceMappingURL=webhook.controller.js.map