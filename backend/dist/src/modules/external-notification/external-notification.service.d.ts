import { OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
export declare class ExternalNotificationService implements OnModuleInit {
    private configService;
    private readonly logger;
    private isFirebaseInitialized;
    constructor(configService: ConfigService);
    onModuleInit(): void;
    private initializeFirebase;
    sendPushNotification(deviceTokens: string[], title: string, body: string, data?: any): Promise<boolean>;
    sendWhatsApp(to: string, message: string): Promise<boolean>;
    sendEmail(to: string, subject: string, body: string): Promise<boolean>;
}
