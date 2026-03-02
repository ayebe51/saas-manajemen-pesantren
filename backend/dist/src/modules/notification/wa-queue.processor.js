"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.WaQueueProcessor = void 0;
const common_1 = require("@nestjs/common");
class WaQueueProcessor {
    constructor(waGateway) {
        this.waGateway = waGateway;
        this.logger = new common_1.Logger(WaQueueProcessor.name);
    }
    async process(job) {
        this.logger.debug(`Memproses Antrean Pesan WA untuk Job ID: ${job.id}`);
        const { targetPhone, message } = job.data;
        await new Promise((resolve) => setTimeout(resolve, 1500));
        const result = await this.waGateway.sendMessage(targetPhone, message);
        if (!result) {
            this.logger.error(`Whatsapp pengingat SPP gagal dikirim ke ${targetPhone}`);
        }
        return result;
    }
}
exports.WaQueueProcessor = WaQueueProcessor;
//# sourceMappingURL=wa-queue.processor.js.map