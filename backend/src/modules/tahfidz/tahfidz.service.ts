import { Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { CreateMutabaahDto, CreateTahfidzDto, TahfidzType } from './dto/tahfidz.dto';

@Injectable()
export class TahfidzService {
  private readonly logger = new Logger(TahfidzService.name);

  constructor(private readonly prisma: PrismaService) {}

  async createTahfidz(tenantId: string, userId: string, dto: CreateTahfidzDto) {
    // Validate santri exists
    const santri = await this.prisma.santri.findFirst({
      where: { id: dto.santriId, tenantId },
    });
    if (!santri) {
      throw new NotFoundException(`Santri dengan ID ${dto.santriId} tidak ditemukan di tenant ini`);
    }

    // Validate type enum
    if (!Object.values(TahfidzType).includes(dto.type)) {
      throw new BadRequestException(`Tipe setoran tidak valid. Gunakan: ${Object.values(TahfidzType).join(', ')}`);
    }

    // Validate date if provided
    let recordDate = new Date();
    if (dto.date) {
      recordDate = new Date(dto.date);
      if (isNaN(recordDate.getTime())) {
        throw new BadRequestException('Format tanggal tidak valid. Gunakan ISO 8601 format (YYYY-MM-DD)');
      }
    }

    try {
      const tahfidz = await this.prisma.tahfidz.create({
        data: {
          tenantId,
          santriId: dto.santriId,
          surah: dto.surah.trim(),
          ayat: dto.ayat?.trim(),
          type: dto.type,
          grade: dto.grade?.trim(),
          notes: dto.notes?.trim(),
          date: recordDate,
          recordedBy: userId,
        },
        include: {
          santri: { select: { id: true, name: true, kelas: true } },
        },
      });

      this.logger.log(`Tahfidz record created: ${tahfidz.id} for santri ${tahfidz.santriId}`);
      return tahfidz;
    } catch (error) {
      this.logger.error(`Failed to create tahfidz record: ${error.message}`, error.stack);
      throw error;
    }
  }

  async getTahfidzBySantri(tenantId: string, santriId: string) {
    // Validate santri exists
    const santri = await this.prisma.santri.findFirst({
      where: { id: santriId, tenantId },
    });
    if (!santri) {
      throw new NotFoundException(`Santri dengan ID ${santriId} tidak ditemukan di tenant ini`);
    }

    return this.prisma.tahfidz.findMany({
      where: { tenantId, santriId },
      orderBy: { date: 'desc' },
      include: {
        santri: { select: { id: true, name: true, kelas: true } },
      },
    });
  }

  async getTahfidzAllSantri(tenantId: string) {
    return this.prisma.tahfidz.findMany({
      where: { tenantId },
      orderBy: { date: 'desc' },
      include: {
        santri: { select: { id: true, name: true, kelas: true } },
      },
    });
  }

  async createOrUpdateMutabaah(tenantId: string, userId: string, dto: CreateMutabaahDto) {
    // Validate santri exists
    const santri = await this.prisma.santri.findFirst({
      where: { id: dto.santriId, tenantId },
    });
    if (!santri) {
      throw new NotFoundException(`Santri dengan ID ${dto.santriId} tidak ditemukan di tenant ini`);
    }

    const targetDate = dto.date ? new Date(dto.date) : new Date();
    
    // Validate date if provided
    if (dto.date && isNaN(targetDate.getTime())) {
      throw new BadRequestException('Format tanggal tidak valid. Gunakan ISO 8601 format (YYYY-MM-DD)');
    }

    // Normalize to start of day
    targetDate.setHours(0, 0, 0, 0);
    const nextDay = new Date(targetDate);
    nextDay.setDate(targetDate.getDate() + 1);

    try {
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
            notes: dto.notes?.trim() ?? existing.notes,
            recordedBy: userId,
          },
          include: {
            santri: { select: { id: true, name: true, kelas: true } },
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
          notes: dto.notes?.trim(),
          recordedBy: userId,
        },
        include: {
          santri: { select: { id: true, name: true, kelas: true } },
        },
      });
    } catch (error) {
      this.logger.error(`Failed to create/update mutabaah record: ${error.message}`, error.stack);
      throw error;
    }
  }

  async getMutabaahBySantri(tenantId: string, santriId: string) {
    // Validate santri exists
    const santri = await this.prisma.santri.findFirst({
      where: { id: santriId, tenantId },
    });
    if (!santri) {
      throw new NotFoundException(`Santri dengan ID ${santriId} tidak ditemukan di tenant ini`);
    }

    return this.prisma.mutabaah.findMany({
      where: { tenantId, santriId },
      orderBy: { date: 'desc' },
      take: 30, // Get last 30 entries
      include: {
        santri: { select: { id: true, name: true, kelas: true } },
      },
    });
  }
}
