import { PaymentService } from './payment.service';
export declare class PaymentController {
    private readonly paymentService;
    private readonly logger;
    constructor(paymentService: PaymentService);
    requestTopUp(tenantId: string, santriId: string, amount: number): Promise<any>;
    midtransWebhookNotification(notificationBody: any): Promise<any>;
}
