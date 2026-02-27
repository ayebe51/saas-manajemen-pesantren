import { WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { WhatsappGatewayService } from './whatsapp-gateway.service';
export declare class WaQueueProcessor extends WorkerHost {
    private readonly waGateway;
    private readonly logger;
    constructor(waGateway: WhatsappGatewayService);
    process(job: Job<any, any, string>): Promise<any>;
}
