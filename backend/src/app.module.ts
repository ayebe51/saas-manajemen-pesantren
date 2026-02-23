import { Module, MiddlewareConsumer, NestModule, RequestMethod } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { BullModule } from '@nestjs/bullmq';

// Core
import { PrismaModule } from './common/prisma/prisma.module';
import { TenantMiddleware } from './common/middleware/tenant.middleware';
import { TenantGuard } from './common/guards/tenant.guard';

// Function Modules
import { AuthModule } from './modules/auth/auth.module';
import { TenantModule } from './modules/tenant/tenant.module';
import { SantriModule } from './modules/santri/santri.module';
import { PerizinanModule } from './modules/perizinan/perizinan.module';
import { CatatanModule } from './modules/catatan/catatan.module';
import { PembayaranModule } from './modules/pembayaran/pembayaran.module';
import { PelanggaranModule } from './modules/pelanggaran/pelanggaran.module';
import { KunjunganModule } from './modules/kunjungan/kunjungan.module';
import { KesehatanModule } from './modules/kesehatan/kesehatan.module';
import { DashboardModule } from './modules/dashboard/dashboard.module';
import { PublicModule } from './modules/public/public.module';
import { NotificationModule } from './modules/notification/notification.module';
import { JobsModule } from './jobs/jobs.module';
import { UploadModule } from './modules/upload/upload.module';
import { ExternalNotificationModule } from './modules/external-notification/external-notification.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    ThrottlerModule.forRoot([{
      ttl: 60000,
      limit: 100, // 100 requests per minute
    }]),
    BullModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        connection: {
          host: configService.get('REDIS_HOST') || 'localhost',
          port: configService.get('REDIS_PORT') || 6379,
        },
      }),
      inject: [ConfigService],
    }),
    PrismaModule,
    AuthModule,
    TenantModule,
    SantriModule,
    PerizinanModule,
    CatatanModule,
    PembayaranModule,
    PelanggaranModule,
    KunjunganModule,
    KesehatanModule,
    DashboardModule,
    PublicModule,
    NotificationModule,
    JobsModule,
    UploadModule,
    ExternalNotificationModule,
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
    // We register the TenantGuard globally to enforce data isolation explicitly.
    // Superadmins bypass this implicitly within the guard logic, public endpoints explicitly using @Public().
    {
      provide: APP_GUARD,
      useClass: TenantGuard,
    },
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(TenantMiddleware)
      .exclude(
        { path: 'api/v1/auth/(.*)', method: RequestMethod.ALL }, // Login doesn't need tenant mid, payload handles it
      )
      .forRoutes('*'); // Apply everywhere else
  }
}
