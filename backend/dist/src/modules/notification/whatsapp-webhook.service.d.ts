import { PrismaService } from '../../common/prisma/prisma.service';
import { ExternalNotificationService } from '../external-notification/external-notification.service';
export declare class WhatsappWebhookService {
    private readonly prisma;
    private readonly extNotificationService;
    private readonly logger;
    constructor(prisma: PrismaService, extNotificationService: ExternalNotificationService);
    handleIncomingMessage(payload: any): Promise<void>;
}
