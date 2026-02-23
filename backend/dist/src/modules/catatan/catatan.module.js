"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CatatanModule = void 0;
const common_1 = require("@nestjs/common");
const catatan_service_1 = require("./catatan.service");
const catatan_controller_1 = require("./catatan.controller");
const prisma_module_1 = require("../../common/prisma/prisma.module");
let CatatanModule = class CatatanModule {
};
exports.CatatanModule = CatatanModule;
exports.CatatanModule = CatatanModule = __decorate([
    (0, common_1.Module)({
        imports: [prisma_module_1.PrismaModule],
        controllers: [catatan_controller_1.CatatanController],
        providers: [catatan_service_1.CatatanService],
        exports: [catatan_service_1.CatatanService],
    })
], CatatanModule);
//# sourceMappingURL=catatan.module.js.map