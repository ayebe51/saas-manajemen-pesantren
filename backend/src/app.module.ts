import { Module, MiddlewareConsumer, NestModule, RequestMethod } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { CacheModule } from '@nestjs/cache-manager';

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
import { PembayaranSppModule } from './modules/pembayaran/pembayaran-spp.module';
import { PelanggaranModule } from './modules/pelanggaran/pelanggaran.module';
import { KunjunganModule } from './modules/kunjungan/kunjungan.module';
import { KesehatanModule } from './modules/kesehatan/kesehatan.module';
import { DashboardModule } from './modules/dashboard/dashboard.module';
import { PublicModule } from './modules/public/public.module';
import { NotificationModule } from './modules/notification/notification.module';
import { JobsModule } from './jobs/jobs.module';
import { UploadModule } from './modules/upload/upload.module';
import { ExternalNotificationModule } from './modules/external-notification/external-notification.module';
import { WaEngineModule } from './modules/wa-engine/wa-engine.module';
import { TahfidzModule } from './modules/tahfidz/tahfidz.module';
import { WalletModule } from './modules/wallet/wallet.module';
import { AcademicModule } from './modules/academic/academic.module';
import { EmployeeModule } from './modules/employee/employee.module';
import { AuditLogModule } from './modules/audit-log/audit-log.module';
import { PpdbModule } from './modules/ppdb/ppdb.module';
import { InventoryModule } from './modules/inventory/inventory.module';
import { DormitoryModule } from './modules/dormitory/dormitory.module';
import { ReportModule } from './modules/report/report.module';
import { AnalyticsModule } from './modules/analytics/analytics.module';
import { PaymentModule } from './modules/payment/payment.module';
import { WaliPortalModule } from './modules/wali-portal/wali-portal.module';
import { AttendanceModule } from './modules/attendance/attendance.module';
import { PointsModule } from './modules/points/points.module';
import { RbacModule } from './modules/rbac/rbac.module';
import { LicenseModule } from './modules/license/license.module';
import { LicenseGuard } from './common/guards/license.guard';
import { EidModule } from './modules/eid/eid.module';

@Module({
  imports: [
    EventEmitterModule.forRoot(),
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    ThrottlerModule.forRoot([
      {
        name: 'short',
        ttl: 60000,
        limit: 30,   // 30 req/min per IP for public endpoints — Requirement 22.7
      },
      {
        name: 'medium',
        ttl: 60000,
        limit: 100,  // 100 req/min per user
      },
    ]),
    CacheModule.register({
      isGlobal: true,
      ttl: 300,
    }),
    PrismaModule,
    AuthModule,
    TenantModule,
    SantriModule,
    PerizinanModule,
    CatatanModule,
    PembayaranModule,
    PembayaranSppModule,
    PelanggaranModule,
    KunjunganModule,
    KesehatanModule,
    DashboardModule,
    PublicModule,
    NotificationModule,
    JobsModule,
    UploadModule,
    ExternalNotificationModule,
    WaEngineModule,
    TahfidzModule,
    WalletModule,
    AcademicModule,
    EmployeeModule,
    AuditLogModule,
    PpdbModule,
    InventoryModule,
    DormitoryModule,
    ReportModule,
    AnalyticsModule,
    PaymentModule,
    WaliPortalModule,
    AttendanceModule,
    PointsModule,
    RbacModule,
    LicenseModule,
    EidModule,
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
    // LicenseGuard enforces read-only mode when license is EXPIRED/REVOKED/INACTIVE.
    // Applied after JwtAuthGuard and RolesGuard in the pipeline — Requirements 19.3, 19.4
    {
      provide: APP_GUARD,
      useClass: LicenseGuard,
    },
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(TenantMiddleware)
      .exclude(
        { path: 'api/v1/auth/(.*)', method: RequestMethod.ALL },
        { path: 'api/v1/wali/(.*)', method: RequestMethod.ALL },
        { path: 'api/v1/public/(.*)', method: RequestMethod.ALL },
      )
      .forRoutes('*'); // Apply everywhere else
  }
}
