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
var PembayaranService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.PembayaranService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../common/prisma/prisma.service");
const stripe_service_1 = require("./stripe.service");
let PembayaranService = PembayaranService_1 = class PembayaranService {
    constructor(prisma, stripeService) {
        this.prisma = prisma;
        this.stripeService = stripeService;
        this.logger = new common_1.Logger(PembayaranService_1.name);
    }
    async findAllInvoices(tenantId, filters) {
        const whereClause = { tenantId };
        if (filters.santriId)
            whereClause.santriId = filters.santriId;
        if (filters.status)
            whereClause.status = filters.status;
        return this.prisma.invoice.findMany({
            where: whereClause,
            include: {
                lines: true,
                santri: { select: { name: true, nisn: true } }
            },
            orderBy: { dueDate: 'asc' }
        });
    }
    async generateInvoice(tenantId, dto) {
        const totalAmount = dto.lines.reduce((sum, line) => sum + line.amount, 0);
        return this.prisma.invoice.create({
            data: {
                tenantId,
                santriId: dto.santriId,
                amountDue: totalAmount,
                dueDate: new Date(dto.dueDate),
                status: 'UNPAID',
                lines: {
                    create: dto.lines.map(line => ({
                        description: line.description,
                        amount: line.amount,
                        type: line.type
                    }))
                }
            },
            include: { lines: true }
        });
    }
    async createPaymentIntent(tenantId, dto) {
        const invoice = await this.prisma.invoice.findFirst({
            where: { id: dto.invoiceId, tenantId },
            include: {
                payments: true
            }
        });
        if (!invoice) {
            throw new common_1.NotFoundException('Invoice not found');
        }
        if (invoice.status === 'PAID') {
            throw new common_1.BadRequestException('Invoice is already paid fully');
        }
        const paidAmount = invoice.payments
            .filter(p => p.status === 'SUCCESS')
            .reduce((sum, p) => sum + p.amount, 0);
        const remainingBalance = invoice.amountDue - paidAmount;
        const amountToPay = dto.amount || remainingBalance;
        if (amountToPay > remainingBalance) {
            throw new common_1.BadRequestException('Payment amount cannot exceed remaining balance');
        }
        const intent = await this.stripeService.createPaymentIntent(amountToPay, 'idr', {
            invoiceId: invoice.id,
            tenantId,
            santriId: invoice.santriId
        });
        await this.prisma.payment.create({
            data: {
                invoiceId: invoice.id,
                method: 'STRIPE',
                amount: amountToPay,
                status: 'PENDING',
                transactionRef: intent.id
            }
        });
        return {
            clientSecret: intent.client_secret,
            amount: amountToPay,
            currency: 'idr'
        };
    }
    async handleSuccessfulPayment(transactionRef, invoiceId, amount, tenantId) {
        this.logger.log(`Handling successful payment webhook: ${transactionRef} for invoice ${invoiceId}`);
        return this.prisma.$transaction(async (prisma) => {
            const existingPayment = await prisma.payment.findFirst({
                where: { transactionRef }
            });
            if (existingPayment) {
                if (existingPayment.status === 'SUCCESS')
                    return;
                await prisma.payment.update({
                    where: { id: existingPayment.id },
                    data: { status: 'SUCCESS', paidAt: new Date() }
                });
            }
            else {
                await prisma.payment.create({
                    data: {
                        invoiceId,
                        method: 'STRIPE_WEBHOOK',
                        amount,
                        status: 'SUCCESS',
                        transactionRef,
                        paidAt: new Date()
                    }
                });
            }
            const invoice = await prisma.invoice.findUnique({
                where: { id: invoiceId },
                include: { payments: { where: { status: 'SUCCESS' } } }
            });
            const allPayments = await prisma.payment.findMany({
                where: { invoiceId, status: 'SUCCESS' }
            });
            const totalPaid = allPayments.reduce((sum, p) => sum + p.amount, 0);
            let newStatus = 'PARTIAL';
            if (invoice && totalPaid >= invoice.amountDue) {
                newStatus = 'PAID';
            }
            await prisma.invoice.update({
                where: { id: invoiceId },
                data: { status: newStatus }
            });
            this.logger.log(`[Job Trigger] Generate Receipt PDF for invoice: ${invoiceId}`);
        });
    }
};
exports.PembayaranService = PembayaranService;
exports.PembayaranService = PembayaranService = PembayaranService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        stripe_service_1.StripeService])
], PembayaranService);
//# sourceMappingURL=pembayaran.service.js.map