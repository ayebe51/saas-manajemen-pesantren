import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { CreateSantriDto, UpdateSantriDto, CreateWaliDto } from './dto/santri.dto';

@Injectable()
export class SantriService {
  constructor(private readonly prisma: PrismaService) {}

  async create(tenantId: string, createSantriDto: CreateSantriDto) {
    return this.prisma.santri.create({
      data: {
        ...createSantriDto,
        tenantId,
      },
    });
  }

  async findAll(tenantId: string, filters: { kelas?: string; room?: string }) {
    const whereClause: any = { tenantId };
    
    if (filters.kelas) whereClause.kelas = filters.kelas;
    if (filters.room) whereClause.room = filters.room;

    return this.prisma.santri.findMany({
      where: whereClause,
      include: {
        walis: {
          include: { wali: true }
        }
      },
      orderBy: { name: 'asc' }
    });
  }

  async findOne(id: string, tenantId: string) {
    const santri = await this.prisma.santri.findFirst({
      where: { id, tenantId },
      include: {
        walis: {
          include: { wali: true }
        },
        _count: {
          select: { izin: true, pelanggaran: true, invoices: true }
        }
      }
    });

    if (!santri) {
      throw new NotFoundException(`Santri with ID ${id} not found`);
    }

    return santri;
  }

  async update(id: string, tenantId: string, updateSantriDto: UpdateSantriDto) {
    // Verify existence and tenant access
    await this.findOne(id, tenantId);

    return this.prisma.santri.update({
      where: { id },
      data: updateSantriDto,
    });
  }

  async addWali(santriId: string, tenantId: string, createWaliDto: CreateWaliDto) {
    // Verify santri belongs to tenant
    await this.findOne(santriId, tenantId);

    // Is this the first wali? Make it primary if so
    const existingLinks = await this.prisma.santriWali.count({
      where: { santriId }
    });
    const isPrimary = existingLinks === 0;

    // Create wali and link in transaction
    return this.prisma.$transaction(async (prisma) => {
      const wali = await prisma.wali.create({
        data: {
          ...createWaliDto,
          tenantId,
        }
      });

      await prisma.santriWali.create({
        data: {
          santriId,
          waliId: wali.id,
          isPrimary
        }
      });

      return wali;
    });
  }

  async linkWali(santriId: string, waliId: string, tenantId: string) {
    // Verify santri
    await this.findOne(santriId, tenantId);

    // Verify wali belongs to tenant
    const wali = await this.prisma.wali.findFirst({
      where: { id: waliId, tenantId }
    });

    if (!wali) {
      throw new NotFoundException(`Wali with ID ${waliId} not found`);
    }

    // Check if link already exists
    const existingLink = await this.prisma.santriWali.findUnique({
      where: { santriId_waliId: { santriId, waliId } }
    });

    if (existingLink) {
      return existingLink; // Already linked
    }

    const existingLinksCount = await this.prisma.santriWali.count({
      where: { santriId }
    });

    return this.prisma.santriWali.create({
      data: {
        santriId,
        waliId,
        isPrimary: existingLinksCount === 0
      }
    });
  }
}
