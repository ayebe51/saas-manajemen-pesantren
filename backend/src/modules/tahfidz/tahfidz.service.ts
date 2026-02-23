import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { CreateMutabaahDto, CreateTahfidzDto } from './dto/tahfidz.dto';

@Injectable()
export class TahfidzService {
  private readonly logger = new Logger(TahfidzService.name);

  constructor(private readonly prisma: PrismaService) {}

  async createTahfidz(tenantId: string, userId: string, dto: CreateTahfidzDto) {
    const santri = await this.prisma.santri.findFirst({
      where: { id: dto.santriId, tenantId },
    });
    if (!santri) {
      throw new NotFoundException('Santri not found in this tenant');
    }

    const tahfidz = await this.prisma.tahfidz.create({
      data: {
        tenantId,
        santriId: dto.santriId,
        surah: dto.surah,
        ayat: dto.ayat,
        type: dto.type,
        grade: dto.grade,
        notes: dto.notes,
        date: dto.date ? new Date(dto.date) : new Date(),
        recordedBy: userId, // Assuming userId is passed from JWT
      },
    });

    return tahfidz;
  }

  async getTahfidzBySantri(tenantId: string, santriId: string) {
    return this.prisma.tahfidz.findMany({
      where: { tenantId, santriId },
      orderBy: { date: 'desc' },
    });
  }

  async createOrUpdateMutabaah(tenantId: string, userId: string, dto: CreateMutabaahDto) {
    const santri = await this.prisma.santri.findFirst({
      where: { id: dto.santriId, tenantId },
    });
    if (!santri) {
      throw new NotFoundException('Santri not found in this tenant');
    }

    const targetDate = dto.date ? new Date(dto.date) : new Date();
    // Normalize to start of day
    targetDate.setHours(0, 0, 0, 0);
    const nextDay = new Date(targetDate);
    nextDay.setDate(targetDate.getDate() + 1);

    // Check if exists for today
    const existing = await this.prisma.mutabaah.findFirst({
      where: {
        tenantId,
        santriId: dto.santriId,
        date: {
          gte: targetDate,
          lt: nextDay,
        },
      },
    });

    if (existing) {
      return this.prisma.mutabaah.update({
        where: { id: existing.id },
        data: {
          sholatWajib: dto.sholatWajib ?? existing.sholatWajib,
          tahajud: dto.tahajud ?? existing.tahajud,
          dhuha: dto.dhuha ?? existing.dhuha,
          puasaSunnah: dto.puasaSunnah ?? existing.puasaSunnah,
          bacaQuran: dto.bacaQuran ?? existing.bacaQuran,
          notes: dto.notes ?? existing.notes,
          recordedBy: userId,
        },
      });
    }

    return this.prisma.mutabaah.create({
      data: {
        tenantId,
        santriId: dto.santriId,
        date: targetDate,
        sholatWajib: dto.sholatWajib ?? true,
        tahajud: dto.tahajud ?? false,
        dhuha: dto.dhuha ?? false,
        puasaSunnah: dto.puasaSunnah ?? false,
        bacaQuran: dto.bacaQuran ?? true,
        notes: dto.notes,
        recordedBy: userId,
      },
    });
  }

  async getMutabaahBySantri(tenantId: string, santriId: string) {
    return this.prisma.mutabaah.findMany({
      where: { tenantId, santriId },
      orderBy: { date: 'desc' },
      take: 30, // Get last 30 entries
    });
  }
}
