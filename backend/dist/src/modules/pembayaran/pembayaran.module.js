"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PembayaranModule = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const pembayaran_service_1 = require("./pembayaran.service");
const pembayaran_controller_1 = require("./pembayaran.controller");
const stripe_service_1 = require("./stripe.service");
const prisma_module_1 = require("../../common/prisma/prisma.module");
let PembayaranModule = class PembayaranModule {
};
exports.PembayaranModule = PembayaranModule;
exports.PembayaranModule = PembayaranModule = __decorate([
    (0, common_1.Module)({
        imports: [prisma_module_1.PrismaModule, config_1.ConfigModule],
        controllers: [pembayaran_controller_1.PembayaranController],
        providers: [pembayaran_service_1.PembayaranService, stripe_service_1.StripeService],
        exports: [pembayaran_service_1.PembayaranService],
    })
], PembayaranModule);
//# sourceMappingURL=pembayaran.module.js.map