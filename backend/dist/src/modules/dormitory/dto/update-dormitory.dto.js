"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UpdateDormitoryDto = void 0;
const swagger_1 = require("@nestjs/swagger");
const create_dormitory_dto_1 = require("./create-dormitory.dto");
class UpdateDormitoryDto extends (0, swagger_1.PartialType)(create_dormitory_dto_1.CreateDormitoryDto) {
}
exports.UpdateDormitoryDto = UpdateDormitoryDto;
//# sourceMappingURL=update-dormitory.dto.js.map