import { ConfigService } from '@nestjs/config';
import Stripe from 'stripe';
export declare class StripeService {
    private configService;
    private stripe;
    private readonly logger;
    constructor(configService: ConfigService);
    createPaymentIntent(amount: number, currency?: string, metadata?: any): Promise<Stripe.Response<Stripe.PaymentIntent> | {
        id: string;
        client_secret: string;
        status: string;
    }>;
    constructEvent(payload: string | Buffer, signature: string): Stripe.Event;
}
