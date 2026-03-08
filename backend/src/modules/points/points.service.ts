import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';

@Injectable()
export class PointsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(tenantId: string) {
    const points = await this.prisma.point.findMany({
      where: { tenantId },
      include: {
        santri: { select: { name: true, kelas: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    return points.map((p) => ({
      id: p.id,
      santriId: p.santriId,
      santriName: p.santri.name,
      category: p.category,
      points: p.points,
      description: p.description,
      createdAt: p.createdAt,
    }));
  }

  async create(
    tenantId: string,
    data: { santriId: string; category: string; points: number; description: string },
    userId?: string,
  ) {
    // Verify santri belongs to tenant
    const santri = await this.prisma.santri.findFirst({
      where: { id: data.santriId, tenantId },
    });

    if (!santri) {
      throw new Error('Santri tidak ditemukan.');
    }

    return this.prisma.point.create({
      data: {
        tenantId,
        santriId: data.santriId,
        category: data.category,
        points: data.points,
        description: data.description,
        createdBy: userId,
      },
    });
  }
}
