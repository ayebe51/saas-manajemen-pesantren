import { WhatsappGatewayService } from './whatsapp-gateway.service';
export declare class WaQueueProcessor {
    private readonly waGateway;
    private readonly logger;
    constructor(waGateway: WhatsappGatewayService);
    process(job: any): Promise<any>;
}
