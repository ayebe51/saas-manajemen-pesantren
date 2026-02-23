import { Module, Global } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ExternalNotificationService } from './external-notification.service';

@Global()
@Module({
  imports: [ConfigModule],
  providers: [ExternalNotificationService],
  exports: [ExternalNotificationService],
})
export class ExternalNotificationModule {}
