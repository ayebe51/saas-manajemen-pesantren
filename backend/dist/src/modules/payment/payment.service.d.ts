import { PrismaService } from '../../common/prisma/prisma.service';
import { EventEmitter2 } from '@nestjs/event-emitter';
export declare class PaymentService {
    private prisma;
    private eventEmitter;
    private readonly logger;
    private snapApi;
    private coreApi;
    constructor(prisma: PrismaService, eventEmitter: EventEmitter2);
    createTopUpTransaction(tenantId: string, santriId: string, amount: number): Promise<any>;
    handleMidtransWebhook(notificationPayload: any): Promise<{
        success: boolean;
        message: string;
    }>;
}
