import { Module } from '@nestjs/common';
import { PublicService } from './public.service';
import { PublicController } from './public.controller';
import { WebhookController } from './webhook.controller';
import { PrismaModule } from '../../common/prisma/prisma.module';
import { ConfigModule } from '@nestjs/config';
import { NotificationModule } from '../notification/notification.module';
import { PpdbPublicController } from './ppdb-public.controller';
import { PpdbModule } from '../ppdb/ppdb.module';
import { UploadModule } from '../upload/upload.module';

@Module({
  imports: [PrismaModule, ConfigModule, NotificationModule, PpdbModule, UploadModule],
  controllers: [PublicController, WebhookController, PpdbPublicController],
  providers: [PublicService],
  exports: [PublicService],
})
export class PublicModule {}
