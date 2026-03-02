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
var PaymentService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.PaymentService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../common/prisma/prisma.service");
const event_emitter_1 = require("@nestjs/event-emitter");
const midtransClient = require("midtrans-client");
let PaymentService = PaymentService_1 = class PaymentService {
    constructor(prisma, eventEmitter) {
        this.prisma = prisma;
        this.eventEmitter = eventEmitter;
        this.logger = new common_1.Logger(PaymentService_1.name);
        this.snapApi = new midtransClient.Snap({
            isProduction: false,
            serverKey: process.env.MIDTRANS_SERVER_KEY || 'SB-Mid-server-x1x2x3x4',
            clientKey: process.env.MIDTRANS_CLIENT_KEY || 'SB-Mid-client-y1y2y3y4',
        });
        this.coreApi = new midtransClient.CoreApi({
            isProduction: false,
            serverKey: process.env.MIDTRANS_SERVER_KEY || 'SB-Mid-server-x1x2x3x4',
            clientKey: process.env.MIDTRANS_CLIENT_KEY || 'SB-Mid-client-y1y2y3y4',
        });
    }
    async createTopUpTransaction(tenantId, santriId, amount) {
        try {
            const santri = await this.prisma.santri.findFirst({
                where: { id: santriId, tenantId },
                include: { wallet: true },
            });
            if (!santri) {
                throw new common_1.BadRequestException('Data Santri tidak valid / tidak ditemukan di Database.');
            }
            if (!santri.wallet) {
                throw new common_1.BadRequestException('Santri ini belum memiliki Dompet Elektronik aktif.');
            }
            const orderId = `TOPUP-${santri.id}-${Date.now()}`;
            const transactionDetails = {
                transaction_details: {
                    order_id: orderId,
                    gross_amount: amount,
                },
                customer_details: {
                    first_name: santri.name,
                    email: `${santri.nisn}@al-ikhlas.com`,
                    phone: '08123456789',
                },
                item_details: [
                    {
                        id: 'TOPUP-WALLET',
                        price: amount,
                        quantity: 1,
                        name: `Top Up Saldo Dompet E-Pesantren`,
                    },
                ],
                custom_field1: tenantId,
                custom_field2: santri.wallet.id,
            };
            this.logger.log(`Meminta Snap Token untuk Order ${orderId}...`);
            const transactionToken = await this.snapApi.createTransaction(transactionDetails);
            return transactionToken;
        }
        catch (error) {
            this.logger.error(`Failed to create TopUp Transaction: ${error.message}`);
            throw new common_1.InternalServerErrorException('Gagal menghubungi Payment Gateway Server.');
        }
    }
    async handleMidtransWebhook(notificationPayload) {
        try {
            const statusResponse = await this.coreApi.transaction.notification(notificationPayload);
            const orderId = statusResponse.order_id;
            const transactionStatus = statusResponse.transaction_status;
            const fraudStatus = statusResponse.fraud_status;
            const tenantId = statusResponse.custom_field1;
            const walletId = statusResponse.custom_field2;
            const grossAmount = parseInt(statusResponse.gross_amount);
            this.logger.log(`Menerima Notification Midtrans Order: ${orderId} | Status: ${transactionStatus}`);
            if (transactionStatus === 'capture' || transactionStatus === 'settlement') {
                if (fraudStatus === 'challenge') {
                    this.logger.warn(`Challenge transaksi ${orderId}, tunggu keputusan manual fraud radar.`);
                    return { success: true, message: 'Challenge mode received' };
                }
                await this.prisma.$transaction(async (prisma) => {
                    const existingTx = await prisma.walletTransaction.findFirst({
                        where: { reference: orderId },
                    });
                    if (existingTx && existingTx.status === 'SUCCESS') {
                        return;
                    }
                    await prisma.walletTransaction.create({
                        data: {
                            walletId: walletId,
                            amount: grossAmount,
                            type: 'TOPUP',
                            status: 'SUCCESS',
                            description: `Top-Up Mandiri via Midtrans Payment (#${orderId})`,
                            reference: orderId,
                            method: 'TRANSFER',
                        },
                    });
                    await prisma.wallet.update({
                        where: { id: walletId },
                        data: { balance: { increment: grossAmount } },
                    });
                });
                this.logger.log(`Saldo ${grossAmount} telah sukses masuk ke Wallet ${walletId}!`);
                this.eventEmitter.emit('wallet.topup.success', {
                    walletId: walletId,
                    amount: grossAmount,
                    trxId: orderId,
                });
            }
            else if (transactionStatus === 'cancel' ||
                transactionStatus === 'deny' ||
                transactionStatus === 'expire') {
                this.logger.log(`Transaksi ${orderId} gagal/batal (${transactionStatus}). Tidak memotong/menambah saldo apapun.`);
            }
            return { success: true, message: 'Webhook Processed' };
        }
        catch (e) {
            this.logger.error(`Error Handle Midtrans Webhook: ${e.message}`);
            throw new common_1.InternalServerErrorException('Failed Webhook Processing');
        }
    }
};
exports.PaymentService = PaymentService;
exports.PaymentService = PaymentService = PaymentService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        event_emitter_1.EventEmitter2])
], PaymentService);
//# sourceMappingURL=payment.service.js.map