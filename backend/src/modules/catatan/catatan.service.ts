import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { CreateCatatanDto, CreatePengumumanDto } from './dto/catatan.dto';

@Injectable()
export class CatatanService {
  constructor(private readonly prisma: PrismaService) {}

  // --- CATATAN HARIAN ---

  async createCatatan(tenantId: string, createCatatanDto: CreateCatatanDto, authorId: string) {
    const santri = await this.prisma.santri.findFirst({
      where: { id: createCatatanDto.santriId, tenantId },
    });

    if (!santri) {
      throw new NotFoundException('Santri not found');
    }

    return this.prisma.catatanHarian.create({
      data: {
        tenantId,
        authorId,
        ...createCatatanDto,
      },
    });
  }

  async findAllCatatan(tenantId: string, santriId?: string) {
    const whereClause: any = { tenantId };

    if (santriId) {
      whereClause.santriId = santriId;
    }

    return this.prisma.catatanHarian.findMany({
      where: whereClause,
      include: {
        santri: { select: { name: true, kelas: true } },
      },
      orderBy: { date: 'desc' },
    });
  }

  // --- PENGUMUMAN ---

  async createPengumuman(tenantId: string, createPengumumanDto: CreatePengumumanDto) {
    return this.prisma.pengumuman.create({
      data: {
        tenantId,
        ...createPengumumanDto,
      },
    });
  }

  async findAllPengumuman(tenantId: string, audience?: string) {
    const whereClause: any = { tenantId };

    if (audience) {
      // Logic for filtering audience can be expanded (e.g. ALL + specific audience)
      whereClause.audience = audience;
    }

    return this.prisma.pengumuman.findMany({
      where: whereClause,
      orderBy: { createdAt: 'desc' },
    });
  }
}
