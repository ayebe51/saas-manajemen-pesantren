import { ExternalNotificationService } from '../../external-notification/external-notification.service';
export declare class NotificationProcessor {
    private externalNotification;
    private readonly logger;
    constructor(externalNotification: ExternalNotificationService);
    process(job: any): Promise<any>;
}
