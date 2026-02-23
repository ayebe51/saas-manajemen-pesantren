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
exports.AddPpdbExamDto = exports.AddPpdbDocumentDto = exports.UpdatePpdbDto = exports.CreatePpdbDto = void 0;
const swagger_1 = require("@nestjs/swagger");
const class_validator_1 = require("class-validator");
var PpdbStatus;
(function (PpdbStatus) {
    PpdbStatus["PENDING"] = "PENDING";
    PpdbStatus["DOCUMENTS_VERIFIED"] = "DOCUMENTS_VERIFIED";
    PpdbStatus["EXAM_SCHEDULED"] = "EXAM_SCHEDULED";
    PpdbStatus["PASSED"] = "PASSED";
    PpdbStatus["FAILED"] = "FAILED";
    PpdbStatus["ACCEPTED"] = "ACCEPTED";
})(PpdbStatus || (PpdbStatus = {}));
class CreatePpdbDto {
}
exports.CreatePpdbDto = CreatePpdbDto;
__decorate([
    (0, swagger_1.ApiProperty)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], CreatePpdbDto.prototype, "fullName", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ enum: ['L', 'P'] }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], CreatePpdbDto.prototype, "gender", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsDateString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], CreatePpdbDto.prototype, "dob", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], CreatePpdbDto.prototype, "previousSchool", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ enum: ['REGULER', 'PRESTASI', 'MUTASI'], default: 'REGULER' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], CreatePpdbDto.prototype, "pathway", void 0);
class UpdatePpdbDto extends (0, swagger_1.PartialType)(CreatePpdbDto) {
}
exports.UpdatePpdbDto = UpdatePpdbDto;
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ enum: PpdbStatus }),
    (0, class_validator_1.IsEnum)(PpdbStatus),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], UpdatePpdbDto.prototype, "status", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], UpdatePpdbDto.prototype, "notes", void 0);
class AddPpdbDocumentDto {
}
exports.AddPpdbDocumentDto = AddPpdbDocumentDto;
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Tipe Dokumen: KK, AKTA, IJAZAH, PASFOTO' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], AddPpdbDocumentDto.prototype, "documentType", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], AddPpdbDocumentDto.prototype, "fileUrl", void 0);
class AddPpdbExamDto {
}
exports.AddPpdbExamDto = AddPpdbExamDto;
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'TES_TULIS, TES_WAWANCARA, TES_BACA_QURAN' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], AddPpdbExamDto.prototype, "examType", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    (0, class_validator_1.IsDateString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], AddPpdbExamDto.prototype, "examDate", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Number)
], AddPpdbExamDto.prototype, "score", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'LULUS, TIDAK_LULUS' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], AddPpdbExamDto.prototype, "result", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], AddPpdbExamDto.prototype, "interviewer", void 0);
//# sourceMappingURL=ppdb.dto.js.map