import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { CreatePelanggaranDto, CreatePembinaanDto } from './dto/pelanggaran.dto';

@Injectable()
export class PelanggaranService {
  constructor(private readonly prisma: PrismaService) {}

  async createPelanggaran(tenantId: string, dto: CreatePelanggaranDto, recordedBy: string) {
    const santri = await this.prisma.santri.findFirst({
      where: { id: dto.santriId, tenantId },
    });

    if (!santri) {
      throw new NotFoundException('Santri not found');
    }

    // Points logic could be more complex, but here we just map severity
    const pointsMap: Record<number, number> = { 1: 5, 2: 10, 3: 20, 4: 50, 5: 100 };
    const points = pointsMap[dto.severity] || 0;

    return this.prisma.pelanggaran.create({
      data: {
        tenantId,
        santriId: dto.santriId,
        recordedBy,
        category: dto.category,
        severity: dto.severity,
        points,
        description: dto.description,
      },
    });
  }

  async findAllPelanggaran(tenantId: string, santriId?: string) {
    const whereClause: any = { tenantId };
    if (santriId) whereClause.santriId = santriId;

    return this.prisma.pelanggaran.findMany({
      where: whereClause,
      include: {
        santri: { select: { name: true, kelas: true } },
      },
      orderBy: { date: 'desc' },
    });
  }

  async createPembinaan(tenantId: string, dto: CreatePembinaanDto) {
    const santri = await this.prisma.santri.findFirst({
      where: { id: dto.santriId, tenantId },
    });

    if (!santri) {
      throw new NotFoundException('Santri not found');
    }

    return this.prisma.pembinaan.create({
      data: {
        tenantId,
        santriId: dto.santriId,
        plan: dto.plan,
        targetDate: new Date(dto.targetDate),
        assignedTo: dto.assignedTo,
        status: 'ONGOING',
      },
    });
  }

  async findAllPembinaan(tenantId: string, santriId?: string) {
    const whereClause: any = { tenantId };
    if (santriId) whereClause.santriId = santriId;

    return this.prisma.pembinaan.findMany({
      where: whereClause,
      include: {
        santri: { select: { name: true } },
      },
      orderBy: { targetDate: 'asc' },
    });
  }
}
