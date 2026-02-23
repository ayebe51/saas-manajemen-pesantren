"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var ExternalNotificationService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.ExternalNotificationService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const axios_1 = require("axios");
const admin = require("firebase-admin");
let ExternalNotificationService = ExternalNotificationService_1 = class ExternalNotificationService {
    constructor(configService) {
        this.configService = configService;
        this.logger = new common_1.Logger(ExternalNotificationService_1.name);
        this.isFirebaseInitialized = false;
    }
    onModuleInit() {
        this.initializeFirebase();
    }
    initializeFirebase() {
        try {
            const projectId = this.configService.get('FIREBASE_PROJECT_ID');
            const clientEmail = this.configService.get('FIREBASE_CLIENT_EMAIL');
            const privateKey = this.configService.get('FIREBASE_PRIVATE_KEY')?.replace(/\\n/g, '\n');
            if (projectId && clientEmail && privateKey) {
                admin.initializeApp({
                    credential: admin.credential.cert({
                        projectId,
                        clientEmail,
                        privateKey,
                    }),
                });
                this.isFirebaseInitialized = true;
                this.logger.log('Firebase Admin SDK initialized successfully for Push Notifications.');
            }
            else {
                this.logger.warn('Firebase configuration missing in .env. FCM Push Notifications will be disabled.');
            }
        }
        catch (error) {
            this.logger.error(`Failed to initialize Firebase Admin: ${error.message}`);
        }
    }
    async sendPushNotification(deviceTokens, title, body, data) {
        if (!this.isFirebaseInitialized) {
            this.logger.debug(`[FCM Mock Output] To: ${deviceTokens.length} devices | Title: ${title} | Body: ${body}`);
            return true;
        }
        if (!deviceTokens || deviceTokens.length === 0)
            return false;
        try {
            const message = {
                notification: {
                    title,
                    body,
                },
                data: data || {},
                tokens: deviceTokens,
            };
            const response = await admin.messaging().sendEachForMulticast(message);
            this.logger.log(`[FCM] Sent Push Notification: ${response.successCount} successful, ${response.failureCount} failed.`);
            if (response.failureCount > 0) {
                const failedTokens = [];
                response.responses.forEach((resp, idx) => {
                    if (!resp.success) {
                        failedTokens.push(deviceTokens[idx]);
                        this.logger.warn(`Failed token: ${deviceTokens[idx]} - Reason: ${resp.error?.message}`);
                    }
                });
            }
            return response.successCount > 0;
        }
        catch (error) {
            this.logger.error(`Failed to send push notification: ${error.message}`);
            return false;
        }
    }
    async sendWhatsApp(to, message) {
        const waProviderUrl = this.configService.get('WA_PROVIDER_URL');
        const waToken = this.configService.get('WA_PROVIDER_TOKEN');
        if (!waProviderUrl || !waToken) {
            this.logger.warn(`[WA Missing Config] Cannot send message to ${to}. Provider URL or Token is not configured in .env`);
            this.logger.debug(`[WA Local Debug Output]: To: ${to} | MSG: ${message}`);
            return true;
        }
        try {
            this.logger.log(`[WA] Sending real message to ${to} via webhook provider...`);
            const payload = {
                target: to,
                message: message,
                typing: false,
                delay: '1',
            };
            const response = await axios_1.default.post(waProviderUrl, payload, {
                headers: {
                    Authorization: waToken,
                },
                timeout: 10000,
            });
            this.logger.log(`[WA] Successfully sent message to ${to}. Provider response: ${JSON.stringify(response.data)}`);
            return true;
        }
        catch (error) {
            this.logger.error(`Failed to send WhatsApp message to ${to}: ${error.message}`);
            return false;
        }
    }
    async sendEmail(to, subject, body) {
        this.logger.log(`[Email Mock] Sending email to ${to}\nSubject: ${subject}\nBody: ${body}`);
        await new Promise((resolve) => setTimeout(resolve, 300));
        return true;
    }
};
exports.ExternalNotificationService = ExternalNotificationService;
exports.ExternalNotificationService = ExternalNotificationService = ExternalNotificationService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService])
], ExternalNotificationService);
//# sourceMappingURL=external-notification.service.js.map