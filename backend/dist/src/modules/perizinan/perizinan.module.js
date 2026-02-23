"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PerizinanModule = void 0;
const common_1 = require("@nestjs/common");
const perizinan_service_1 = require("./perizinan.service");
const perizinan_controller_1 = require("./perizinan.controller");
const prisma_module_1 = require("../../common/prisma/prisma.module");
let PerizinanModule = class PerizinanModule {
};
exports.PerizinanModule = PerizinanModule;
exports.PerizinanModule = PerizinanModule = __decorate([
    (0, common_1.Module)({
        imports: [prisma_module_1.PrismaModule],
        controllers: [perizinan_controller_1.PerizinanController],
        providers: [perizinan_service_1.PerizinanService],
        exports: [perizinan_service_1.PerizinanService],
    })
], PerizinanModule);
//# sourceMappingURL=perizinan.module.js.map