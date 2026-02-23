import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Stripe from 'stripe';

@Injectable()
export class StripeService {
  private stripe: Stripe | null;
  private readonly logger = new Logger(StripeService.name);

  constructor(private configService: ConfigService) {
    const secretKey = this.configService.get<string>('STRIPE_SECRET_KEY');

    // Initialize with mock mode if no key is provided (for local dev)
    if (!secretKey || secretKey.startsWith('mock_')) {
      this.logger.warn('Stripe is running in mock mode. No real transactions will occur.');
      this.stripe = null;
    } else {
      this.stripe = new Stripe(secretKey, {
        apiVersion: '2023-10-16', // Ensure stable API version
      });
    }
  }

  async createPaymentIntent(amount: number, currency: string = 'idr', metadata: any = {}) {
    if (!this.stripe) {
      // Return mock response
      return {
        id: `pi_mock_${Date.now()}`,
        client_secret: `client_secret_mock_${Date.now()}`,
        status: 'requires_payment_method',
      };
    }

    try {
      return await this.stripe.paymentIntents.create({
        amount, // In simplest unit, for IDR it's just the nominal
        currency,
        metadata,
        payment_method_types: ['card', 'alipay'], // Expand based on Stripe account settings
      });
    } catch (error) {
      this.logger.error(`Failed to create Stripe payment intent: ${error.message}`);
      throw error;
    }
  }

  constructEvent(payload: string | Buffer, signature: string): Stripe.Event {
    if (!this.stripe) {
      // Return mock event
      const parsed = JSON.parse(payload.toString());
      return {
        id: parsed.id || 'evt_mock',
        type: parsed.type || 'payment_intent.succeeded',
        data: parsed.data || {},
      } as any;
    }

    const webhookSecret = this.configService.get<string>('STRIPE_WEBHOOK_SECRET') || '';
    return this.stripe.webhooks.constructEvent(payload, signature, webhookSecret);
  }
}
