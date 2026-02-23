export declare class InvoiceLineDto {
    description: string;
    amount: number;
    type: string;
}
export declare class GenerateInvoiceDto {
    santriId: string;
    dueDate: string;
    lines: InvoiceLineDto[];
}
export declare class CreatePaymentIntentDto {
    invoiceId: string;
    amount?: number;
}
