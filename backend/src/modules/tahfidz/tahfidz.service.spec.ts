import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { TahfidzService } from './tahfidz.service';
import { PrismaService } from '../../common/prisma/prisma.service';
import { CreateTahfidzDto, CreateMutabaahDto, TahfidzType } from './dto/tahfidz.dto';

describe('TahfidzService', () => {
  let service: TahfidzService;
  let prisma: PrismaService;

  const mockTenantId = 'tenant-123';
  const mockUserId = 'user-123';
  const mockSantriId = 'santri-123';

  const mockSantri = {
    id: mockSantriId,
    name: 'Ahmad Hafiz',
    kelas: '3A',
    tenantId: mockTenantId,
  };

  const mockTahfidz = {
    id: 'tahfidz-123',
    tenantId: mockTenantId,
    santriId: mockSantriId,
    surah: 'Al-Baqarah',
    ayat: '1-5',
    type: TahfidzType.ZIYADAH,
    grade: 'LANCAR',
    notes: 'Tajwid bagus',
    date: new Date('2024-01-15'),
    recordedBy: mockUserId,
    createdAt: new Date(),
    santri: mockSantri,
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TahfidzService,
        {
          provide: PrismaService,
          useValue: {
            santri: {
              findFirst: jest.fn(),
            },
            tahfidz: {
              create: jest.fn(),
              findMany: jest.fn(),
            },
            mutabaah: {
              findFirst: jest.fn(),
              create: jest.fn(),
              update: jest.fn(),
            },
          },
        },
      ],
    }).compile();

    service = module.get<TahfidzService>(TahfidzService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  describe('createTahfidz', () => {
    it('should create tahfidz record successfully', async () => {
      const dto: CreateTahfidzDto = {
        santriId: mockSantriId,
        surah: 'Al-Baqarah',
        ayat: '1-5',
        type: TahfidzType.ZIYADAH,
        grade: 'LANCAR',
        notes: 'Tajwid bagus',
      };

      jest.spyOn(prisma.santri, 'findFirst').mockResolvedValue(mockSantri as any);
      jest.spyOn(prisma.tahfidz, 'create').mockResolvedValue(mockTahfidz as any);

      const result = await service.createTahfidz(mockTenantId, mockUserId, dto);

      expect(result).toEqual(mockTahfidz);
      expect(prisma.santri.findFirst).toHaveBeenCalledWith({
        where: { id: mockSantriId, tenantId: mockTenantId },
      });
      expect(prisma.tahfidz.create).toHaveBeenCalled();
    });

    it('should throw NotFoundException if santri not found', async () => {
      const dto: CreateTahfidzDto = {
        santriId: 'invalid-santri-id',
        surah: 'Al-Baqarah',
        type: TahfidzType.ZIYADAH,
      };

      jest.spyOn(prisma.santri, 'findFirst').mockResolvedValue(null);

      await expect(service.createTahfidz(mockTenantId, mockUserId, dto)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw BadRequestException for invalid type', async () => {
      const dto = {
        santriId: mockSantriId,
        surah: 'Al-Baqarah',
        type: 'INVALID_TYPE',
      } as any;

      jest.spyOn(prisma.santri, 'findFirst').mockResolvedValue(mockSantri as any);

      await expect(service.createTahfidz(mockTenantId, mockUserId, dto)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should throw BadRequestException for invalid date format', async () => {
      const dto: CreateTahfidzDto = {
        santriId: mockSantriId,
        surah: 'Al-Baqarah',
        type: TahfidzType.ZIYADAH,
        date: 'invalid-date',
      };

      jest.spyOn(prisma.santri, 'findFirst').mockResolvedValue(mockSantri as any);

      await expect(service.createTahfidz(mockTenantId, mockUserId, dto)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should use current date if date not provided', async () => {
      const dto: CreateTahfidzDto = {
        santriId: mockSantriId,
        surah: 'Al-Baqarah',
        type: TahfidzType.ZIYADAH,
      };

      jest.spyOn(prisma.santri, 'findFirst').mockResolvedValue(mockSantri as any);
      jest.spyOn(prisma.tahfidz, 'create').mockResolvedValue(mockTahfidz as any);

      await service.createTahfidz(mockTenantId, mockUserId, dto);

      const createCall = (prisma.tahfidz.create as jest.Mock).mock.calls[0];
      expect(createCall[0].data.date).toBeInstanceOf(Date);
    });
  });

  describe('getTahfidzBySantri', () => {
    it('should return tahfidz records for a santri', async () => {
      jest.spyOn(prisma.santri, 'findFirst').mockResolvedValue(mockSantri as any);
      jest.spyOn(prisma.tahfidz, 'findMany').mockResolvedValue([mockTahfidz] as any);

      const result = await service.getTahfidzBySantri(mockTenantId, mockSantriId);

      expect(result).toEqual([mockTahfidz]);
      expect(prisma.tahfidz.findMany).toHaveBeenCalledWith({
        where: { tenantId: mockTenantId, santriId: mockSantriId },
        orderBy: { date: 'desc' },
        include: {
          santri: { select: { id: true, name: true, kelas: true } },
        },
      });
    });

    it('should throw NotFoundException if santri not found', async () => {
      jest.spyOn(prisma.santri, 'findFirst').mockResolvedValue(null);

      await expect(service.getTahfidzBySantri(mockTenantId, 'invalid-id')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('createOrUpdateMutabaah', () => {
    it('should create mutabaah record if not exists', async () => {
      const dto: CreateMutabaahDto = {
        santriId: mockSantriId,
        sholatWajib: true,
        tahajud: true,
        bacaQuran: true,
      };

      const mockMutabaah = {
        id: 'mutabaah-123',
        tenantId: mockTenantId,
        santriId: mockSantriId,
        date: new Date(),
        sholatWajib: true,
        tahajud: true,
        dhuha: false,
        puasaSunnah: false,
        bacaQuran: true,
        notes: null,
        recordedBy: mockUserId,
        createdAt: new Date(),
        santri: mockSantri,
      };

      jest.spyOn(prisma.santri, 'findFirst').mockResolvedValue(mockSantri as any);
      jest.spyOn(prisma.mutabaah, 'findFirst').mockResolvedValue(null);
      jest.spyOn(prisma.mutabaah, 'create').mockResolvedValue(mockMutabaah as any);

      const result = await service.createOrUpdateMutabaah(mockTenantId, mockUserId, dto);

      expect(result).toEqual(mockMutabaah);
      expect(prisma.mutabaah.create).toHaveBeenCalled();
    });

    it('should update mutabaah record if exists for today', async () => {
      const dto: CreateMutabaahDto = {
        santriId: mockSantriId,
        sholatWajib: true,
        tahajud: true,
      };

      const existingMutabaah = {
        id: 'mutabaah-123',
        sholatWajib: false,
        tahajud: false,
        dhuha: false,
        puasaSunnah: false,
        bacaQuran: true,
        notes: 'old notes',
      };

      const updatedMutabaah = {
        ...existingMutabaah,
        sholatWajib: true,
        tahajud: true,
        recordedBy: mockUserId,
        santri: mockSantri,
      };

      jest.spyOn(prisma.santri, 'findFirst').mockResolvedValue(mockSantri as any);
      jest.spyOn(prisma.mutabaah, 'findFirst').mockResolvedValue(existingMutabaah as any);
      jest.spyOn(prisma.mutabaah, 'update').mockResolvedValue(updatedMutabaah as any);

      const result = await service.createOrUpdateMutabaah(mockTenantId, mockUserId, dto);

      expect(result).toEqual(updatedMutabaah);
      expect(prisma.mutabaah.update).toHaveBeenCalled();
    });

    it('should throw NotFoundException if santri not found', async () => {
      const dto: CreateMutabaahDto = {
        santriId: 'invalid-id',
      };

      jest.spyOn(prisma.santri, 'findFirst').mockResolvedValue(null);

      await expect(service.createOrUpdateMutabaah(mockTenantId, mockUserId, dto)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw BadRequestException for invalid date format', async () => {
      const dto: CreateMutabaahDto = {
        santriId: mockSantriId,
        date: 'invalid-date',
      };

      jest.spyOn(prisma.santri, 'findFirst').mockResolvedValue(mockSantri as any);

      await expect(service.createOrUpdateMutabaah(mockTenantId, mockUserId, dto)).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('getMutabaahBySantri', () => {
    it('should return last 30 mutabaah records for a santri', async () => {
      const mockMutabaahList = [
        {
          id: 'mutabaah-1',
          date: new Date(),
          sholatWajib: true,
          santri: mockSantri,
        },
      ];

      jest.spyOn(prisma.santri, 'findFirst').mockResolvedValue(mockSantri as any);
      jest.spyOn(prisma.mutabaah, 'findMany').mockResolvedValue(mockMutabaahList as any);

      const result = await service.getMutabaahBySantri(mockTenantId, mockSantriId);

      expect(result).toEqual(mockMutabaahList);
      expect(prisma.mutabaah.findMany).toHaveBeenCalledWith({
        where: { tenantId: mockTenantId, santriId: mockSantriId },
        orderBy: { date: 'desc' },
        take: 30,
        include: {
          santri: { select: { id: true, name: true, kelas: true } },
        },
      });
    });
  });
});
