import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { PrismaModule } from '../../common/prisma/prisma.module';
import { ReportService } from './report.service';
import { ReportController } from './report.controller';
import { ReportWorker } from './report.worker';

/**
 * ReportModule — modul laporan dengan async job queue via BullMQ.
 * Requirements: 21.3, 21.4, 21.5
 */
@Module({
  imports: [
    PrismaModule,
    ConfigModule,
    BullModule.registerQueueAsync({
      name: 'report',
      imports: [ConfigModule],
      useFactory: (config: ConfigService) => ({
        connection: {
          host: config.get<string>('REDIS_HOST', 'localhost'),
          port: config.get<number>('REDIS_PORT', 6379),
          password: config.get<string>('REDIS_PASSWORD'),
        },
      }),
      inject: [ConfigService],
    }),
  ],
  controllers: [ReportController],
  providers: [ReportService, ReportWorker],
  exports: [ReportService],
})
export class ReportModule {}
