import { ConfigService } from '@nestjs/config';
export declare class ExternalNotificationService {
    private configService;
    private readonly logger;
    constructor(configService: ConfigService);
    sendWhatsApp(to: string, message: string): Promise<boolean>;
}
