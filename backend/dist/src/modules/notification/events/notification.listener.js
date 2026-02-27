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
var NotificationEventListener_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.NotificationEventListener = void 0;
const common_1 = require("@nestjs/common");
const event_emitter_1 = require("@nestjs/event-emitter");
const bullmq_1 = require("@nestjs/bullmq");
const bullmq_2 = require("bullmq");
const prisma_service_1 = require("../../../common/prisma/prisma.service");
let NotificationEventListener = NotificationEventListener_1 = class NotificationEventListener {
    constructor(prisma, waQueue) {
        this.prisma = prisma;
        this.waQueue = waQueue;
        this.logger = new common_1.Logger(NotificationEventListener_1.name);
    }
    async handlePelanggaranEvent(payload) {
        this.logger.log(`Event Tertangkap: Pelanggaran baru untuk Santri ID ${payload.santriId}`);
        try {
            const santri = await this.prisma.santri.findUnique({
                where: { id: payload.santriId },
                include: {
                    walis: {
                        where: { isPrimary: true },
                        include: { wali: true },
                    },
                },
            });
            if (!santri || !santri.walis.length) {
                return;
            }
            const waliPhone = santri.walis[0].wali.phone;
            if (!waliPhone)
                return;
            const message = `*INFO KEDISIPLINAN PESANTREN*\n\nAssalamu'alaikum Bpk/Ibu.\n\nKami mengabarkan bahwa putra/putri Anda, Ananda *${santri.name}* telah tercatat melakukan pelanggaran dengan rincian:\n\n- Pelanggaran: ${payload.ruleName}\n- Poin Hukuman: ${payload.points}\n- Tanggal Kejadian: ${payload.date.toLocaleDateString('id-ID')}\n\nMohon kebijaksanaannya dalam membimbing Ananda ketika pulang/telepon.`;
            await this.waQueue.add('send-pelanggaran-alert', {
                targetPhone: waliPhone,
                message: message,
            });
        }
        catch (e) {
            this.logger.error(`Error processing Pelanggaran WA Event: ${e.message}`);
        }
    }
    async handleWalletTopUpSuccess(payload) {
        try {
            const dompet = await this.prisma.wallet.findUnique({
                where: { id: payload.walletId },
                include: {
                    santri: {
                        include: { walis: { where: { isPrimary: true }, include: { wali: true } } },
                    },
                },
            });
            if (!dompet || !dompet.santri?.walis.length)
                return;
            const waliPhone = dompet.santri.walis[0].wali.phone;
            if (!waliPhone)
                return;
            const msg = `*INFO KEUANGAN PESANTREN*\n\nAlhamdulillah, Bapak/Ibu.\n\nTop-Up saldo E-Wallet atas nama Ananda *${dompet.santri.name}* sebesar *Rp ${payload.amount.toLocaleString('id-ID')}* telah SUKSES otomatis ditambahkan ke sistem oleh Payment Gateway.\n\nSaldo Akhir Ananda saat ini: *Rp ${dompet.balance.toLocaleString('id-ID')}*.\n\nTerima kasih.\n- Koperasi Baitul Mal`;
            await this.waQueue.add('send-topup-receipt', {
                targetPhone: waliPhone,
                message: msg,
            });
        }
        catch (e) {
            this.logger.error(`Error broadcast WA Receipt Topup: ${e.message}`);
        }
    }
};
exports.NotificationEventListener = NotificationEventListener;
__decorate([
    (0, event_emitter_1.OnEvent)('pelanggaran.created'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], NotificationEventListener.prototype, "handlePelanggaranEvent", null);
__decorate([
    (0, event_emitter_1.OnEvent)('wallet.topup.success'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], NotificationEventListener.prototype, "handleWalletTopUpSuccess", null);
exports.NotificationEventListener = NotificationEventListener = NotificationEventListener_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(1, (0, bullmq_1.InjectQueue)('wa-messages')),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        bullmq_2.Queue])
], NotificationEventListener);
//# sourceMappingURL=notification.listener.js.map