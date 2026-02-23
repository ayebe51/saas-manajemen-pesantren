"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UpdatePpdbDto = void 0;
const swagger_1 = require("@nestjs/swagger");
const create_ppdb_dto_1 = require("./create-ppdb.dto");
class UpdatePpdbDto extends (0, swagger_1.PartialType)(create_ppdb_dto_1.CreatePpdbDto) {
}
exports.UpdatePpdbDto = UpdatePpdbDto;
//# sourceMappingURL=update-ppdb.dto.js.map