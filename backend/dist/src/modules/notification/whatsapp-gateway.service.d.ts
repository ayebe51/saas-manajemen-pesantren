import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
export declare class WhatsappGatewayService {
    private readonly httpService;
    private readonly configService;
    private readonly logger;
    private readonly apiUrl;
    private readonly apiKey;
    constructor(httpService: HttpService, configService: ConfigService);
    sendMessage(target: string, message: string): Promise<boolean>;
}
