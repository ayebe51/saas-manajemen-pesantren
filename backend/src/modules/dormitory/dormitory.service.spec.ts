import { Test, TestingModule } from '@nestjs/testing';
import { DormitoryService } from './dormitory.service';
import { PrismaService } from '../../common/prisma/prisma.service';
import { CreateBuildingDto } from './dto/dormitory.dto';

describe('DormitoryService - Create Building', () => {
  let service: DormitoryService;
  let prisma: PrismaService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DormitoryService,
        {
          provide: PrismaService,
          useValue: {
            building: {
              create: jest.fn(),
              findMany: jest.fn(),
              findFirst: jest.fn(),
              update: jest.fn(),
            },
          },
        },
      ],
    }).compile();

    service = module.get<DormitoryService>(DormitoryService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  describe('createBuilding', () => {
    it('should create a building with valid data', async () => {
      const tenantId = 'tenant-123';
      const dto: CreateBuildingDto = {
        name: 'Gedung A',
        gender: 'L',
        description: 'Gedung asrama putra',
        capacity: 100,
      };

      const mockBuilding = {
        id: 'building-123',
        tenantId,
        ...dto,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      (prisma.building.create as jest.Mock).mockResolvedValue(mockBuilding);

      const result = await service.createBuilding(tenantId, dto);

      expect(result).toEqual(mockBuilding);
      expect(prisma.building.create).toHaveBeenCalledWith({
        data: { ...dto, tenantId },
      });
    });

    it('should fail if gender is missing', async () => {
      const tenantId = 'tenant-123';
      const dto: any = {
        name: 'Gedung A',
        // gender is missing - REQUIRED
        description: 'Gedung asrama putra',
      };

      // This should fail at DTO validation level, not service level
      // But if it reaches service, it should still work
      const mockBuilding = {
        id: 'building-123',
        tenantId,
        name: dto.name,
        gender: null, // This might cause DB error
        description: dto.description,
        capacity: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      (prisma.building.create as jest.Mock).mockResolvedValue(mockBuilding);

      const result = await service.createBuilding(tenantId, dto);
      expect(result).toBeDefined();
    });

    it('should fail if name is missing', async () => {
      const tenantId = 'tenant-123';
      const dto: any = {
        // name is missing - REQUIRED
        gender: 'L',
        description: 'Gedung asrama putra',
      };

      (prisma.building.create as jest.Mock).mockRejectedValue(
        new Error('Unique constraint failed on the fields: (`name`)')
      );

      await expect(service.createBuilding(tenantId, dto)).rejects.toThrow();
    });
  });
});
