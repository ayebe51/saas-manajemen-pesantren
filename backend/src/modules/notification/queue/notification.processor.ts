import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { Logger } from '@nestjs/common';
import { ExternalNotificationService } from '../../external-notification/external-notification.service';

@Processor('notifications')
export class NotificationProcessor extends WorkerHost {
  private readonly logger = new Logger(NotificationProcessor.name);

  constructor(private externalNotification: ExternalNotificationService) {
    super();
  }

  async process(job: Job<any, any, string>): Promise<any> {
    this.logger.log(`Processing job ${job.id} of type ${job.name}`);

    switch (job.name) {
      case 'send-wa':
        const { phone, message } = job.data;
        await this.externalNotification.sendWhatsApp(phone, message);
        break;

      case 'send-email':
        const { to, subject, body } = job.data;
        await this.externalNotification.sendEmail(to, subject, body);
        break;

      default:
        this.logger.warn(`Job name ${job.name} is not handled.`);
    }

    return true;
  }
}
