"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.NotificationProcessor = void 0;
const common_1 = require("@nestjs/common");
class NotificationProcessor {
    constructor(externalNotification) {
        this.externalNotification = externalNotification;
        this.logger = new common_1.Logger(NotificationProcessor.name);
    }
    async process(job) {
        this.logger.log(`Processing job ${job.id} of type ${job.name}`);
        switch (job.name) {
            case 'send-wa':
                const { phone, message } = job.data;
                await this.externalNotification.sendWhatsApp(phone, message);
                break;
            case 'send-email':
                const { to, subject, body } = job.data;
                await this.externalNotification.sendEmail(to, subject, body);
                break;
            default:
                this.logger.warn(`Job name ${job.name} is not handled.`);
        }
        return true;
    }
}
exports.NotificationProcessor = NotificationProcessor;
//# sourceMappingURL=notification.processor.js.map