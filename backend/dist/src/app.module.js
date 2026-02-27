"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppModule = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const event_emitter_1 = require("@nestjs/event-emitter");
const core_1 = require("@nestjs/core");
const throttler_1 = require("@nestjs/throttler");
const cache_manager_1 = require("@nestjs/cache-manager");
const prisma_module_1 = require("./common/prisma/prisma.module");
const tenant_middleware_1 = require("./common/middleware/tenant.middleware");
const tenant_guard_1 = require("./common/guards/tenant.guard");
const auth_module_1 = require("./modules/auth/auth.module");
const tenant_module_1 = require("./modules/tenant/tenant.module");
const santri_module_1 = require("./modules/santri/santri.module");
const perizinan_module_1 = require("./modules/perizinan/perizinan.module");
const catatan_module_1 = require("./modules/catatan/catatan.module");
const pembayaran_module_1 = require("./modules/pembayaran/pembayaran.module");
const pelanggaran_module_1 = require("./modules/pelanggaran/pelanggaran.module");
const kunjungan_module_1 = require("./modules/kunjungan/kunjungan.module");
const kesehatan_module_1 = require("./modules/kesehatan/kesehatan.module");
const dashboard_module_1 = require("./modules/dashboard/dashboard.module");
const public_module_1 = require("./modules/public/public.module");
const notification_module_1 = require("./modules/notification/notification.module");
const jobs_module_1 = require("./jobs/jobs.module");
const upload_module_1 = require("./modules/upload/upload.module");
const external_notification_module_1 = require("./modules/external-notification/external-notification.module");
const tahfidz_module_1 = require("./modules/tahfidz/tahfidz.module");
const wallet_module_1 = require("./modules/wallet/wallet.module");
const academic_module_1 = require("./modules/academic/academic.module");
const employee_module_1 = require("./modules/employee/employee.module");
const audit_log_module_1 = require("./modules/audit-log/audit-log.module");
const ppdb_module_1 = require("./modules/ppdb/ppdb.module");
const inventory_module_1 = require("./modules/inventory/inventory.module");
const dormitory_module_1 = require("./modules/dormitory/dormitory.module");
const report_module_1 = require("./modules/report/report.module");
const analytics_module_1 = require("./modules/analytics/analytics.module");
const payment_module_1 = require("./modules/payment/payment.module");
let AppModule = class AppModule {
    configure(consumer) {
        consumer
            .apply(tenant_middleware_1.TenantMiddleware)
            .exclude({ path: 'api/v1/auth/(.*)', method: common_1.RequestMethod.ALL })
            .forRoutes('*');
    }
};
exports.AppModule = AppModule;
exports.AppModule = AppModule = __decorate([
    (0, common_1.Module)({
        imports: [
            event_emitter_1.EventEmitterModule.forRoot(),
            config_1.ConfigModule.forRoot({
                isGlobal: true,
                envFilePath: '.env',
            }),
            throttler_1.ThrottlerModule.forRoot([
                {
                    ttl: 60000,
                    limit: 100,
                },
            ]),
            cache_manager_1.CacheModule.register({
                isGlobal: true,
                ttl: 300,
            }),
            prisma_module_1.PrismaModule,
            auth_module_1.AuthModule,
            tenant_module_1.TenantModule,
            santri_module_1.SantriModule,
            perizinan_module_1.PerizinanModule,
            catatan_module_1.CatatanModule,
            pembayaran_module_1.PembayaranModule,
            pelanggaran_module_1.PelanggaranModule,
            kunjungan_module_1.KunjunganModule,
            kesehatan_module_1.KesehatanModule,
            dashboard_module_1.DashboardModule,
            public_module_1.PublicModule,
            notification_module_1.NotificationModule,
            jobs_module_1.JobsModule,
            upload_module_1.UploadModule,
            external_notification_module_1.ExternalNotificationModule,
            tahfidz_module_1.TahfidzModule,
            wallet_module_1.WalletModule,
            academic_module_1.AcademicModule,
            employee_module_1.EmployeeModule,
            audit_log_module_1.AuditLogModule,
            ppdb_module_1.PpdbModule,
            inventory_module_1.InventoryModule,
            dormitory_module_1.DormitoryModule,
            report_module_1.ReportModule,
            analytics_module_1.AnalyticsModule,
            payment_module_1.PaymentModule,
        ],
        providers: [
            {
                provide: core_1.APP_GUARD,
                useClass: throttler_1.ThrottlerGuard,
            },
            {
                provide: core_1.APP_GUARD,
                useClass: tenant_guard_1.TenantGuard,
            },
        ],
    })
], AppModule);
//# sourceMappingURL=app.module.js.map