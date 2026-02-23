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
var ExternalNotificationService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.ExternalNotificationService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
let ExternalNotificationService = ExternalNotificationService_1 = class ExternalNotificationService {
    constructor(configService) {
        this.configService = configService;
        this.logger = new common_1.Logger(ExternalNotificationService_1.name);
    }
    async sendWhatsApp(to, message) {
        this.logger.log(`[WA Mock] Sending message to ${to}:\n${message}`);
        await new Promise(resolve => setTimeout(resolve, 300));
        const twilioSid = this.configService.get('TWILIO_ACCOUNT_SID');
        if (twilioSid) {
            this.logger.debug(`[WA Mock] Twilio SID configured: ${twilioSid}`);
        }
        return true;
    }
    async sendEmail(to, subject, body) {
        this.logger.log(`[Email Mock] Sending email to ${to}\nSubject: ${subject}\nBody: ${body}`);
        await new Promise(resolve => setTimeout(resolve, 300));
        return true;
    }
};
exports.ExternalNotificationService = ExternalNotificationService;
exports.ExternalNotificationService = ExternalNotificationService = ExternalNotificationService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService])
], ExternalNotificationService);
//# sourceMappingURL=external-notification.service.js.map