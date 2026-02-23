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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var PublicController_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.PublicController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const public_service_1 = require("./public.service");
const public_dto_1 = require("./dto/public.dto");
const api_key_guard_1 = require("../../common/guards/api-key.guard");
const tenant_id_decorator_1 = require("../../common/decorators/tenant-id.decorator");
let PublicController = PublicController_1 = class PublicController {
    constructor(publicService) {
        this.publicService = publicService;
        this.logger = new common_1.Logger(PublicController_1.name);
    }
    async syncSantri(dto, tenantId, req) {
        this.logger.log(`Received bulk sync for ${dto.santri.length} santri at tenant ${tenantId}`);
        return this.publicService.bulkUpsertSantri(tenantId, dto);
    }
};
exports.PublicController = PublicController;
__decorate([
    (0, common_1.Post)('sync/santri'),
    (0, swagger_1.ApiOperation)({ summary: 'Bulk upsert Santri data from external SIM' }),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, tenant_id_decorator_1.TenantId)()),
    __param(2, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [public_dto_1.BulkSyncSantriDto, String, Object]),
    __metadata("design:returntype", Promise)
], PublicController.prototype, "syncSantri", null);
exports.PublicController = PublicController = PublicController_1 = __decorate([
    (0, swagger_1.ApiTags)('Public & Integrations'),
    (0, swagger_1.ApiSecurity)('x-api-key'),
    (0, common_1.UseGuards)(api_key_guard_1.ApiKeyGuard),
    (0, common_1.Controller)('public'),
    __metadata("design:paramtypes", [public_service_1.PublicService])
], PublicController);
//# sourceMappingURL=public.controller.js.map