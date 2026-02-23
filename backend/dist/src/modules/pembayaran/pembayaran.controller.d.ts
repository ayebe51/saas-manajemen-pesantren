import { RawBodyRequest } from '@nestjs/common';
import { Request } from 'express';
import { PembayaranService } from './pembayaran.service';
import { GenerateInvoiceDto, CreatePaymentIntentDto } from './dto/pembayaran.dto';
import { StripeService } from './stripe.service';
export declare class PembayaranController {
    private readonly pembayaranService;
    private readonly stripeService;
    constructor(pembayaranService: PembayaranService, stripeService: StripeService);
    findAllInvoices(tenantId: string, santriId?: string, status?: string): Promise<({
        santri: {
            name: string;
            nisn: string | null;
        };
        lines: {
            id: string;
            type: string;
            description: string;
            amount: number;
            invoiceId: string;
        }[];
    } & {
        id: string;
        status: string;
        createdAt: Date;
        updatedAt: Date;
        tenantId: string;
        santriId: string;
        amountDue: number;
        dueDate: Date;
    })[]>;
    generateInvoice(dto: GenerateInvoiceDto, tenantId: string): Promise<{
        lines: {
            id: string;
            type: string;
            description: string;
            amount: number;
            invoiceId: string;
        }[];
    } & {
        id: string;
        status: string;
        createdAt: Date;
        updatedAt: Date;
        tenantId: string;
        santriId: string;
        amountDue: number;
        dueDate: Date;
    }>;
    createPaymentIntent(dto: CreatePaymentIntentDto, tenantId: string): Promise<{
        clientSecret: string | null;
        amount: number;
        currency: string;
    }>;
    handleStripeWebhook(request: RawBodyRequest<Request>): Promise<{
        received: boolean;
    }>;
}
