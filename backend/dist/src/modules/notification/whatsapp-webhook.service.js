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
var WhatsappWebhookService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.WhatsappWebhookService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../common/prisma/prisma.service");
const external_notification_service_1 = require("../external-notification/external-notification.service");
let WhatsappWebhookService = WhatsappWebhookService_1 = class WhatsappWebhookService {
    constructor(prisma, extNotificationService) {
        this.prisma = prisma;
        this.extNotificationService = extNotificationService;
        this.logger = new common_1.Logger(WhatsappWebhookService_1.name);
    }
    async handleIncomingMessage(payload) {
        this.logger.log(`Received WA Webhook: ${JSON.stringify(payload)}`);
        const sender = payload.sender;
        const message = payload.message?.trim().toUpperCase();
        if (!sender || !message)
            return;
        this.logger.log(`Processing WA message from ${sender}: "${message}"`);
        const wali = await this.prisma.wali.findFirst({
            where: { phone: { contains: sender } },
            include: { santris: { include: { santri: { include: { wallet: true } } } } }
        });
        if (message === 'PING') {
            await this.extNotificationService.sendWhatsApp(sender, 'PONG! Sistem APSS Pesantren terhubung. ✅');
            return;
        }
        if (!wali) {
            if (message.startsWith('INFO') || message.startsWith('SALDO')) {
                await this.extNotificationService.sendWhatsApp(sender, 'Maaf, nomor Anda belum terdaftar di sistem Pesantren kami.');
            }
            return;
        }
        if (message === 'INFO') {
            const santriNames = wali.santris.map((s) => s.santri.name).join(', ');
            await this.extNotificationService.sendWhatsApp(sender, `Halo Bpk/Ibu ${wali.name}, Anda terdaftar sebagai Wali dari: ${santriNames}. Ketik SALDO untuk info uang saku.`);
            return;
        }
        if (message === 'SALDO') {
            let replyMsg = `Hi ${wali.name}, berikut info Saldo Dompet Santri Anda:\n`;
            wali.santris.forEach((s) => {
                const wallet = s.santri.wallet;
                const balance = wallet?.balance || 0;
                replyMsg += `- ${s.santri.name}: Rp ${balance.toLocaleString('id-ID')}\n`;
            });
            await this.extNotificationService.sendWhatsApp(sender, replyMsg);
            return;
        }
        await this.extNotificationService.sendWhatsApp(sender, 'Perintah tidak dikenali. Ketik INFO untuk bantuan.');
    }
};
exports.WhatsappWebhookService = WhatsappWebhookService;
exports.WhatsappWebhookService = WhatsappWebhookService = WhatsappWebhookService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        external_notification_service_1.ExternalNotificationService])
], WhatsappWebhookService);
//# sourceMappingURL=whatsapp-webhook.service.js.map