import { WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { ExternalNotificationService } from '../../external-notification/external-notification.service';
export declare class NotificationProcessor extends WorkerHost {
    private externalNotification;
    private readonly logger;
    constructor(externalNotification: ExternalNotificationService);
    process(job: Job<any, any, string>): Promise<any>;
}
