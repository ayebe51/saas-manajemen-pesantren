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
var WaQueueProcessor_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.WaQueueProcessor = void 0;
const bullmq_1 = require("@nestjs/bullmq");
const common_1 = require("@nestjs/common");
const whatsapp_gateway_service_1 = require("./whatsapp-gateway.service");
let WaQueueProcessor = WaQueueProcessor_1 = class WaQueueProcessor extends bullmq_1.WorkerHost {
    constructor(waGateway) {
        super();
        this.waGateway = waGateway;
        this.logger = new common_1.Logger(WaQueueProcessor_1.name);
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
};
exports.WaQueueProcessor = WaQueueProcessor;
exports.WaQueueProcessor = WaQueueProcessor = WaQueueProcessor_1 = __decorate([
    (0, bullmq_1.Processor)('wa-messages'),
    __metadata("design:paramtypes", [whatsapp_gateway_service_1.WhatsappGatewayService])
], WaQueueProcessor);
//# sourceMappingURL=wa-queue.processor.js.map