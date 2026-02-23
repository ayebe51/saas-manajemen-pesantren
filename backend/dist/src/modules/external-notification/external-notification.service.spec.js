"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const testing_1 = require("@nestjs/testing");
const external_notification_service_1 = require("./external-notification.service");
describe('ExternalNotificationService', () => {
    let service;
    beforeEach(async () => {
        const module = await testing_1.Test.createTestingModule({
            providers: [external_notification_service_1.ExternalNotificationService],
        }).compile();
        service = module.get(external_notification_service_1.ExternalNotificationService);
    });
    it('should be defined', () => {
        expect(service).toBeDefined();
    });
});
//# sourceMappingURL=external-notification.service.spec.js.map