import { Test, TestingModule } from '@nestjs/testing';
import { ExternalNotificationService } from './external-notification.service';

describe('ExternalNotificationService', () => {
  let service: ExternalNotificationService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ExternalNotificationService],
    }).compile();

    service = module.get<ExternalNotificationService>(ExternalNotificationService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
