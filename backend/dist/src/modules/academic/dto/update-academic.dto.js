"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UpdateAcademicDto = void 0;
const swagger_1 = require("@nestjs/swagger");
const create_academic_dto_1 = require("./create-academic.dto");
class UpdateAcademicDto extends (0, swagger_1.PartialType)(create_academic_dto_1.CreateAcademicDto) {
}
exports.UpdateAcademicDto = UpdateAcademicDto;
//# sourceMappingURL=update-academic.dto.js.map