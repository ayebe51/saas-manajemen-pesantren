import { PrismaService } from '../../common/prisma/prisma.service';
import { StripeService } from './stripe.service';
import { GenerateInvoiceDto, CreatePaymentIntentDto } from './dto/pembayaran.dto';
export declare class PembayaranService {
    private readonly prisma;
    private readonly stripeService;
    private readonly logger;
    constructor(prisma: PrismaService, stripeService: StripeService);
    findAllInvoices(tenantId: string, filters: {
        santriId?: string;
        status?: string;
    }): Promise<({
        santri: {
            name: string;
            nisn: string | null;
        };
        lines: {
            id: string;
            type: string;
            description: string;
            invoiceId: string;
            amount: number;
        }[];
    } & {
        id: string;
        tenantId: string;
        createdAt: Date;
        updatedAt: Date;
        status: string;
        santriId: string;
        amountDue: number;
        dueDate: Date;
    })[]>;
    generateInvoice(tenantId: string, dto: GenerateInvoiceDto): Promise<{
        lines: {
            id: string;
            type: string;
            description: string;
            invoiceId: string;
            amount: number;
        }[];
    } & {
        id: string;
        tenantId: string;
        createdAt: Date;
        updatedAt: Date;
        status: string;
        santriId: string;
        amountDue: number;
        dueDate: Date;
    }>;
    createPaymentIntent(tenantId: string, dto: CreatePaymentIntentDto): Promise<{
        clientSecret: string | null;
        amount: number;
        currency: string;
    }>;
    handleSuccessfulPayment(transactionRef: string, invoiceId: string, amount: number, tenantId: string): Promise<void>;
}
