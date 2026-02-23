import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { NotificationGateway } from './notification.gateway';
import { BullModule } from '@nestjs/bullmq';
import { NotificationProcessor } from './queue/notification.processor';
import { ExternalNotificationModule } from '../external-notification/external-notification.module';
import { WhatsappWebhookService } from './whatsapp-webhook.service';
import { PrismaModule } from '../../common/prisma/prisma.module';

@Module({
  imports: [
    ExternalNotificationModule,
    PrismaModule,
    BullModule.registerQueue({
      name: 'notifications', // Queue name
    }),
  ],
  providers: [NotificationGateway, NotificationProcessor, WhatsappWebhookService],
  exports: [NotificationGateway, BullModule, WhatsappWebhookService],
})
export class NotificationModule {}
