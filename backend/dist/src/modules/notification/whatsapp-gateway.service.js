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
var WhatsappGatewayService_1;
var _a;
Object.defineProperty(exports, "__esModule", { value: true });
exports.WhatsappGatewayService = void 0;
const common_1 = require("@nestjs/common");
const axios_1 = require("@nestjs/axios");
const config_1 = require("@nestjs/config");
const rxjs_1 = require("rxjs");
let WhatsappGatewayService = WhatsappGatewayService_1 = class WhatsappGatewayService {
    constructor(httpService, configService) {
        this.httpService = httpService;
        this.configService = configService;
        this.logger = new common_1.Logger(WhatsappGatewayService_1.name);
        this.apiUrl = 'https://api.fonnte.com/send';
        this.apiKey = this.configService.get('FONNTE_API_KEY') || 'mock-fonnte-key';
    }
    async sendMessage(target, message) {
        try {
            if (this.apiKey === 'mock-fonnte-key') {
                this.logger.debug(`[MOCK MODE] Whatsapp Dikirim ke ${target}: \n${message}`);
                return true;
            }
            const response = await (0, rxjs_1.firstValueFrom)(this.httpService.post(this.apiUrl, {
                target: target,
                message: message,
                countryCode: '62',
            }, {
                headers: {
                    Authorization: this.apiKey,
                },
            }));
            if (response.data.status) {
                this.logger.log(`WhatsApp terkirim ke ${target}`);
                return true;
            }
            else {
                this.logger.warn(`Gagal kirim WA ke ${target}: ${response.data.reason}`);
                return false;
            }
        }
        catch (error) {
            this.logger.error(`Error Fonnte API Request: ${error.message}`);
            return false;
        }
    }
};
exports.WhatsappGatewayService = WhatsappGatewayService;
exports.WhatsappGatewayService = WhatsappGatewayService = WhatsappGatewayService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [typeof (_a = typeof axios_1.HttpService !== "undefined" && axios_1.HttpService) === "function" ? _a : Object, config_1.ConfigService])
], WhatsappGatewayService);
//# sourceMappingURL=whatsapp-gateway.service.js.map