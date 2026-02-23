import { WhatsappWebhookService } from '../notification/whatsapp-webhook.service';
export declare class WebhookController {
    private readonly waWebhookService;
    private readonly logger;
    constructor(waWebhookService: WhatsappWebhookService);
    receiveWhatsappMessage(payload: any): Promise<{
        status: string;
    }>;
}
