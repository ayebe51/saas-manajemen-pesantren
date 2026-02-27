"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.NotificationModule = void 0;
const common_1 = require("@nestjs/common");
const jwt_1 = require("@nestjs/jwt");
const config_1 = require("@nestjs/config");
const notification_gateway_1 = require("./notification.gateway");
const bullmq_1 = require("@nestjs/bullmq");
const external_notification_module_1 = require("../external-notification/external-notification.module");
const whatsapp_webhook_service_1 = require("./whatsapp-webhook.service");
const prisma_module_1 = require("../../common/prisma/prisma.module");
const schedule_1 = require("@nestjs/schedule");
const whatsapp_gateway_service_1 = require("./whatsapp-gateway.service");
const spp_scheduler_1 = require("./schedules/spp.scheduler");
const notification_listener_1 = require("./events/notification.listener");
const axios_1 = require("@nestjs/axios");
let NotificationModule = class NotificationModule {
};
exports.NotificationModule = NotificationModule;
exports.NotificationModule = NotificationModule = __decorate([
    (0, common_1.Module)({
        imports: [
            external_notification_module_1.ExternalNotificationModule,
            prisma_module_1.PrismaModule,
            config_1.ConfigModule,
            axios_1.HttpModule,
            jwt_1.JwtModule.register({}),
            bullmq_1.BullModule.registerQueue({
                name: 'wa-messages',
            }),
            schedule_1.ScheduleModule.forRoot(),
        ],
        providers: [
            notification_gateway_1.NotificationGateway,
            whatsapp_webhook_service_1.WhatsappWebhookService,
            whatsapp_gateway_service_1.WhatsappGatewayService,
            spp_scheduler_1.SppSchedulerService,
            notification_listener_1.NotificationEventListener,
        ],
        exports: [notification_gateway_1.NotificationGateway, whatsapp_webhook_service_1.WhatsappWebhookService, whatsapp_gateway_service_1.WhatsappGatewayService],
    })
], NotificationModule);
//# sourceMappingURL=notification.module.js.map