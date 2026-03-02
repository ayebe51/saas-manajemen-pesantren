import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule } from '@nestjs/config';
import { NotificationGateway } from './notification.gateway';
import { BullModule } from '@nestjs/bullmq';
import { ExternalNotificationModule } from '../external-notification/external-notification.module';
import { WhatsappWebhookService } from './whatsapp-webhook.service';
import { PrismaModule } from '../../common/prisma/prisma.module';
import { ScheduleModule } from '@nestjs/schedule';
import { WhatsappGatewayService } from './whatsapp-gateway.service';
import { SppSchedulerService } from './schedules/spp.scheduler';
import { MonthlyReportScheduler } from './schedules/monthly-report.scheduler';
import { NotificationEventListener } from './events/notification.listener';
import { HttpModule } from '@nestjs/axios';
import { ReportGeneratorService } from './report-generator.service';
import { ReportController } from './report.controller';

@Module({
  imports: [
    ExternalNotificationModule,
    PrismaModule,
    ConfigModule,
    HttpModule,
    JwtModule.register({}),
    // BullModule.registerQueue({
    //  name: 'wa-messages', // Queue name khusus WA
    // }),
    ScheduleModule.forRoot(),
  ],
  providers: [
    NotificationGateway,
    WhatsappWebhookService,
    WhatsappGatewayService,
    SppSchedulerService,
    MonthlyReportScheduler,
    NotificationEventListener,
    ReportGeneratorService,
  ],
  exports: [
    NotificationGateway,
    WhatsappWebhookService,
    WhatsappGatewayService,
    ReportGeneratorService,
  ],
})
export class NotificationModule {}
