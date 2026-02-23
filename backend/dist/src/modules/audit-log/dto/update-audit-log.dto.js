"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UpdateAuditLogDto = void 0;
const swagger_1 = require("@nestjs/swagger");
const create_audit_log_dto_1 = require("./create-audit-log.dto");
class UpdateAuditLogDto extends (0, swagger_1.PartialType)(create_audit_log_dto_1.CreateAuditLogDto) {
}
exports.UpdateAuditLogDto = UpdateAuditLogDto;
//# sourceMappingURL=update-audit-log.dto.js.map