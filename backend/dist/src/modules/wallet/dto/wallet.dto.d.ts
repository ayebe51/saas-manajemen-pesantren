export declare class RequestDepositDto {
    santriId: string;
    amount: number;
    description?: string;
}
export declare class ManualResolveDepositDto {
    transactionId: string;
}
export declare class CreatePaymentDto {
    santriId: string;
    amount: number;
    description: string;
    pin?: string;
}
export declare class MootaWebhookDto {
    bank_id: string;
    account_number: string;
    type: string;
    amount: number;
    description?: string;
}
export declare class CooperativeCheckoutItemDto {
    itemId: string;
    quantity: number;
}
export declare class CooperativeCheckoutDto {
    santriId: string;
    items: CooperativeCheckoutItemDto[];
    totalAmount: number;
}
