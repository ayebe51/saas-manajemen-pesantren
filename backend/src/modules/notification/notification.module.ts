import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { NotificationGateway } from './notification.gateway';
import { BullModule } from '@nestjs/bullmq';
import { NotificationProcessor } from './queue/notification.processor';
import { ExternalNotificationModule } from '../external-notification/external-notification.module';

@Module({
  imports: [
    ExternalNotificationModule,
    BullModule.registerQueue({
      name: 'notifications', // Queue name
    }),
  ],
  providers: [NotificationGateway, NotificationProcessor],
  exports: [NotificationGateway, BullModule],
})
export class NotificationModule {}
