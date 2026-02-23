"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const testing_1 = require("@nestjs/testing");
const upload_controller_1 = require("./upload.controller");
describe('UploadController', () => {
    let controller;
    beforeEach(async () => {
        const module = await testing_1.Test.createTestingModule({
            controllers: [upload_controller_1.UploadController],
        }).compile();
        controller = module.get(upload_controller_1.UploadController);
    });
    it('should be defined', () => {
        expect(controller).toBeDefined();
    });
});
//# sourceMappingURL=upload.controller.spec.js.map