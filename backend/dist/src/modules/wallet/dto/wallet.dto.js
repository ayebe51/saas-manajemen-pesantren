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
Object.defineProperty(exports, "__esModule", { value: true });
exports.CooperativeCheckoutDto = exports.CooperativeCheckoutItemDto = exports.MootaWebhookDto = exports.CreatePaymentDto = exports.ManualResolveDepositDto = exports.RequestDepositDto = void 0;
const swagger_1 = require("@nestjs/swagger");
const class_transformer_1 = require("class-transformer");
const class_validator_1 = require("class-validator");
class RequestDepositDto {
}
exports.RequestDepositDto = RequestDepositDto;
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Santri ID user account' }),
    (0, class_validator_1.IsUUID)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], RequestDepositDto.prototype, "santriId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Nominal top up dasar sebelum ditambah kode unik' }),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(10000),
    __metadata("design:type", Number)
], RequestDepositDto.prototype, "amount", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], RequestDepositDto.prototype, "description", void 0);
class ManualResolveDepositDto {
}
exports.ManualResolveDepositDto = ManualResolveDepositDto;
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Transaction ID for the pending deposit' }),
    (0, class_validator_1.IsUUID)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], ManualResolveDepositDto.prototype, "transactionId", void 0);
class CreatePaymentDto {
}
exports.CreatePaymentDto = CreatePaymentDto;
__decorate([
    (0, swagger_1.ApiProperty)(),
    (0, class_validator_1.IsUUID)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], CreatePaymentDto.prototype, "santriId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(100),
    __metadata("design:type", Number)
], CreatePaymentDto.prototype, "amount", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], CreatePaymentDto.prototype, "description", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'PIN transaksi (opsional untuk MVP)' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], CreatePaymentDto.prototype, "pin", void 0);
class MootaWebhookDto {
}
exports.MootaWebhookDto = MootaWebhookDto;
__decorate([
    (0, swagger_1.ApiProperty)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], MootaWebhookDto.prototype, "bank_id", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], MootaWebhookDto.prototype, "account_number", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], MootaWebhookDto.prototype, "type", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", Number)
], MootaWebhookDto.prototype, "amount", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], MootaWebhookDto.prototype, "description", void 0);
class CooperativeCheckoutItemDto {
}
exports.CooperativeCheckoutItemDto = CooperativeCheckoutItemDto;
__decorate([
    (0, swagger_1.ApiProperty)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], CooperativeCheckoutItemDto.prototype, "itemId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.IsNotEmpty)(),
    (0, class_validator_1.Min)(1),
    __metadata("design:type", Number)
], CooperativeCheckoutItemDto.prototype, "quantity", void 0);
class CooperativeCheckoutDto {
}
exports.CooperativeCheckoutDto = CooperativeCheckoutDto;
__decorate([
    (0, swagger_1.ApiProperty)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], CooperativeCheckoutDto.prototype, "santriId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ type: [CooperativeCheckoutItemDto] }),
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.ValidateNested)({ each: true }),
    (0, class_transformer_1.Type)(() => CooperativeCheckoutItemDto),
    __metadata("design:type", Array)
], CooperativeCheckoutDto.prototype, "items", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.IsNotEmpty)(),
    (0, class_validator_1.Min)(1),
    __metadata("design:type", Number)
], CooperativeCheckoutDto.prototype, "totalAmount", void 0);
//# sourceMappingURL=wallet.dto.js.map