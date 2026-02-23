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
var WalletService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.WalletService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../common/prisma/prisma.service");
let WalletService = WalletService_1 = class WalletService {
    constructor(prisma) {
        this.prisma = prisma;
        this.logger = new common_1.Logger(WalletService_1.name);
    }
    async getWallet(tenantId, santriId) {
        let wallet = await this.prisma.wallet.findUnique({
            where: { santriId },
            include: {
                transactions: {
                    orderBy: { createdAt: 'desc' },
                    take: 15,
                },
            },
        });
        if (!wallet) {
            const santri = await this.prisma.santri.findFirst({
                where: { id: santriId, tenantId },
            });
            if (!santri)
                throw new common_1.NotFoundException('Santri not found');
            wallet = await this.prisma.wallet.create({
                data: { tenantId, santriId },
                include: { transactions: true },
            });
        }
        return wallet;
    }
    async requestDeposit(tenantId, dto) {
        const wallet = await this.getWallet(tenantId, dto.santriId);
        const uniqueCode = Math.floor(Math.random() * 999) + 1;
        const finalAmount = dto.amount + uniqueCode;
        const trx = await this.prisma.walletTransaction.create({
            data: {
                walletId: wallet.id,
                amount: finalAmount,
                type: 'DEPOSIT',
                method: 'TRANSFER',
                status: 'PENDING',
                description: dto.description || `Top up via transfer bank sejumlah IDR ${finalAmount}`,
            },
        });
        return {
            message: 'Permintaan deposit sukses. Silakan transfer tepat sesuai nominal unik.',
            uniqueAmount: finalAmount,
            transaction: trx,
        };
    }
    async manualResolveDeposit(tenantId, userId, dto) {
        return this.prisma.$transaction(async (tx) => {
            const trx = await tx.walletTransaction.findUnique({
                where: { id: dto.transactionId },
                include: { wallet: true },
            });
            if (!trx || trx.wallet.tenantId !== tenantId) {
                throw new common_1.NotFoundException('Transaction not found');
            }
            if (trx.status !== 'PENDING') {
                throw new common_1.BadRequestException('Transaction is not in PENDING state');
            }
            const updatedTrx = await tx.walletTransaction.update({
                where: { id: trx.id },
                data: {
                    status: 'SUCCESS',
                    handledBy: userId,
                },
            });
            await tx.wallet.update({
                where: { id: trx.walletId },
                data: {
                    balance: { increment: trx.amount },
                },
            });
            return updatedTrx;
        });
    }
    async makePayment(tenantId, cashierId, dto) {
        return this.prisma.$transaction(async (tx) => {
            const wallet = await tx.wallet.findUnique({
                where: { santriId: dto.santriId },
            });
            if (!wallet || wallet.tenantId !== tenantId) {
                throw new common_1.NotFoundException('Wallet not found for this santri');
            }
            if (!wallet.isActive) {
                throw new common_1.BadRequestException('Wallet is inactive');
            }
            if (wallet.balance < dto.amount) {
                throw new common_1.BadRequestException('Insufficient balance');
            }
            const trx = await tx.walletTransaction.create({
                data: {
                    walletId: wallet.id,
                    amount: dto.amount,
                    type: 'PAYMENT',
                    method: 'POS/CASHLESS',
                    status: 'SUCCESS',
                    description: dto.description,
                    handledBy: cashierId,
                },
            });
            await tx.wallet.update({
                where: { id: wallet.id },
                data: { balance: { decrement: dto.amount } },
            });
            return trx;
        });
    }
    async handleMootaWebhook(tenantId, payload) {
        this.logger.log(`Received API Webhook from Moota with ${payload.length} mutations.`);
        const results = { success: 0, failed: 0, skipped: 0 };
        for (const mutation of payload) {
            if (mutation.type !== 'CR') {
                results.skipped++;
                continue;
            }
            const pendingTrx = await this.prisma.walletTransaction.findFirst({
                where: {
                    amount: mutation.amount,
                    status: 'PENDING',
                    type: 'DEPOSIT',
                    wallet: { tenantId },
                },
                include: { wallet: true },
            });
            if (pendingTrx) {
                await this.prisma.$transaction(async (tx) => {
                    await tx.walletTransaction.update({
                        where: { id: pendingTrx.id },
                        data: {
                            status: 'SUCCESS',
                            reference: `MOOTA-${mutation.bank_id}`,
                            handledBy: 'SYSTEM_WEBHOOK_MOOTA',
                        },
                    });
                    await tx.wallet.update({
                        where: { id: pendingTrx.walletId },
                        data: { balance: { increment: pendingTrx.amount } },
                    });
                });
                results.success++;
            }
            else {
                this.logger.warn(`Unidentified Deposit: No pending matching amount ${mutation.amount}`);
                results.failed++;
            }
        }
        return results;
    }
};
exports.WalletService = WalletService;
exports.WalletService = WalletService = WalletService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], WalletService);
//# sourceMappingURL=wallet.service.js.map