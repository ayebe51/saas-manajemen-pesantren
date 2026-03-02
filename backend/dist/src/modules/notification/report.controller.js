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
Object.defineProperty(exports, "__esModule", { value: true });
exports.ReportController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const report_generator_service_1 = require("./report-generator.service");
const public_decorator_1 = require("../../common/decorators/public.decorator");
let ReportController = class ReportController {
    constructor(reportService) {
        this.reportService = reportService;
    }
    async downloadReport(tenantId, res, queryMonth, queryYear) {
        const now = new Date();
        const month = queryMonth ? parseInt(queryMonth) : now.getMonth() + 1;
        const year = queryYear ? parseInt(queryYear) : now.getFullYear();
        const pdfBuffer = await this.reportService.generateMonthlyReport(tenantId, month, year);
        res.set({
            'Content-Type': 'application/pdf',
            'Content-Disposition': `attachment; filename=Report-${month}-${year}.pdf`,
            'Content-Length': pdfBuffer.length,
        });
        res.end(pdfBuffer);
    }
};
exports.ReportController = ReportController;
__decorate([
    (0, common_1.Get)('monthly/:tenantId'),
    (0, swagger_1.ApiOperation)({ summary: 'Simulate/Download PDF Report for current month' }),
    __param(0, (0, common_1.Param)('tenantId')),
    __param(1, (0, common_1.Res)()),
    __param(2, (0, common_1.Query)('month')),
    __param(3, (0, common_1.Query)('year')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, String, String]),
    __metadata("design:returntype", Promise)
], ReportController.prototype, "downloadReport", null);
exports.ReportController = ReportController = __decorate([
    (0, swagger_1.ApiTags)('Report Sandbox (Demo)'),
    (0, common_1.Controller)('report'),
    (0, public_decorator_1.Public)(),
    __metadata("design:paramtypes", [report_generator_service_1.ReportGeneratorService])
], ReportController);
//# sourceMappingURL=report.controller.js.map