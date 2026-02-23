"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.KunjunganModule = void 0;
const common_1 = require("@nestjs/common");
const kunjungan_service_1 = require("./kunjungan.service");
const kunjungan_controller_1 = require("./kunjungan.controller");
const prisma_module_1 = require("../../common/prisma/prisma.module");
let KunjunganModule = class KunjunganModule {
};
exports.KunjunganModule = KunjunganModule;
exports.KunjunganModule = KunjunganModule = __decorate([
    (0, common_1.Module)({
        imports: [prisma_module_1.PrismaModule],
        controllers: [kunjungan_controller_1.KunjunganController],
        providers: [kunjungan_service_1.KunjunganService],
        exports: [kunjungan_service_1.KunjunganService],
    })
], KunjunganModule);
//# sourceMappingURL=kunjungan.module.js.map