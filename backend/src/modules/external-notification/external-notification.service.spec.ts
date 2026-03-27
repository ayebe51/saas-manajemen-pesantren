import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { ExternalNotificationService } from './external-notification.service';

describe('ExternalNotificationService', () => {
  let service: ExternalNotificationService;

  const mockConfigService = {
    get: jest.fn().mockImplementation((key: string) => {
      if (key === 'FIREBASE_PROJECT_ID') return 'test-project';
      return null;
    }),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ExternalNotificationService,
        { provide: ConfigService, useValue: mockConfigService },
      ],
    }).compile();

    service = module.get<ExternalNotificationService>(ExternalNotificationService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
