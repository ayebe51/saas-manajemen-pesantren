import { Module, Global } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { PrismaModule } from '../../common/prisma/prisma.module';
import { WaQueueService } from './wa-queue.service';
import { WaWorkerService } from './wa-worker.service';
import { TemplateEngine } from './template.engine';
import { WA_PROVIDER_ADAPTER } from './provider/wa-provider.interface';
import { createWaProviderAdapter } from './provider/wa-provider.factory';

/**
 * WaEngineModule — modul global untuk WhatsApp notification engine.
 * Menyediakan WaQueueService untuk digunakan oleh semua modul bisnis.
 * Requirements: 18.1 - 18.8
 */
@Global()
@Module({
  imports: [ConfigModule, PrismaModule],
  providers: [
    WaQueueService,
    WaWorkerService,
    TemplateEngine,
    {
      provide: WA_PROVIDER_ADAPTER,
      useFactory: (config: ConfigService) => createWaProviderAdapter(config),
      inject: [ConfigService],
    },
  ],
  exports: [WaQueueService, TemplateEngine],
})
export class WaEngineModule {}
