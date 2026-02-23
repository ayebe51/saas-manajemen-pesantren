import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { CreateKunjunganDto } from './dto/kunjungan.dto';

@Injectable()
export class KunjunganService {
  constructor(private readonly prisma: PrismaService) {}

  async create(tenantId: string, dto: CreateKunjunganDto) {
    const santri = await this.prisma.santri.findFirst({
      where: { id: dto.santriId, tenantId },
    });

    if (!santri) {
      throw new NotFoundException('Santri not found');
    }

    // Check quota for that date and slot
    const targetDate = new Date(dto.scheduledAt);
    targetDate.setHours(0, 0, 0, 0);
    const nextDay = new Date(targetDate);
    nextDay.setDate(nextDay.getDate() + 1);

    const existingVisits = await this.prisma.kunjungan.count({
      where: {
        tenantId,
        slot: dto.slot,
        scheduledAt: {
          gte: targetDate,
          lt: nextDay,
        },
        status: { not: 'CANCELLED' },
      },
    });

    // In a real app, this limit would come from Tenant settings
    const MAX_VISITS_PER_SLOT = 50;

    if (existingVisits >= MAX_VISITS_PER_SLOT) {
      throw new BadRequestException('Slot kuota kunjungan sudah penuh untuk hari dan sesi ini.');
    }

    return this.prisma.kunjungan.create({
      data: {
        tenantId,
        santriId: dto.santriId,
        scheduledAt: new Date(dto.scheduledAt),
        slot: dto.slot,
        visitorLimit: dto.visitorLimit || 2,
        status: 'SCHEDULED',
      },
    });
  }

  async findAll(tenantId: string, filters: { date?: string; santriId?: string }) {
    const whereClause: any = { tenantId };

    if (filters.santriId) whereClause.santriId = filters.santriId;

    if (filters.date) {
      const targetDate = new Date(filters.date);
      targetDate.setHours(0, 0, 0, 0);
      const nextDay = new Date(targetDate);
      nextDay.setDate(nextDay.getDate() + 1);

      whereClause.scheduledAt = {
        gte: targetDate,
        lt: nextDay,
      };
    }

    return this.prisma.kunjungan.findMany({
      where: whereClause,
      include: {
        santri: { select: { name: true, room: true } },
        tamu: true,
      },
      orderBy: { scheduledAt: 'asc' },
    });
  }

  async getAvailableSlots(tenantId: string, dateStr: string) {
    const targetDate = new Date(dateStr);
    targetDate.setHours(0, 0, 0, 0);
    const nextDay = new Date(targetDate);
    nextDay.setDate(nextDay.getDate() + 1);

    const visits = await this.prisma.kunjungan.groupBy({
      by: ['slot'],
      where: {
        tenantId,
        scheduledAt: {
          gte: targetDate,
          lt: nextDay,
        },
        status: { not: 'CANCELLED' },
      },
      _count: {
        id: true,
      },
    });

    const MAX_VISITS_PER_SLOT = 50;
    const slots = ['MORNING', 'AFTERNOON'];

    return slots.map((slot) => {
      const booked = visits.find((v) => v.slot === slot)?._count.id || 0;
      return {
        slot,
        booked,
        available: MAX_VISITS_PER_SLOT - booked,
        isFull: booked >= MAX_VISITS_PER_SLOT,
      };
    });
  }

  async checkin(id: string, tenantId: string, visitorName?: string) {
    const visit = await this.prisma.kunjungan.findFirst({
      where: { id, tenantId },
      include: { tamu: true },
    });

    if (!visit) {
      throw new NotFoundException('Visit not found');
    }

    if (visit.status === 'CANCELLED' || visit.status === 'COMPLETED') {
      throw new BadRequestException(`Cannot check in. Status is ${visit.status}`);
    }

    if (visit.tamu.length >= visit.visitorLimit) {
      throw new BadRequestException('Visitor limit reached for this booking');
    }

    return this.prisma.$transaction(async (prisma) => {
      // Create guest record
      const guestName = visitorName || 'Wali Santri';
      await prisma.tamu.create({
        data: {
          kunjunganId: id,
          name: guestName,
          checkinAt: new Date(),
        },
      });

      // Update visit status
      return prisma.kunjungan.update({
        where: { id },
        data: { status: 'CHECKED_IN' },
        include: { tamu: true },
      });
    });
  }
}
