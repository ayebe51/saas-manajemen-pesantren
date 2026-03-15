import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';

@Injectable()
export class AttendanceService {
  constructor(private readonly prisma: PrismaService) {}

  async findToday(tenantId: string) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const records = await this.prisma.attendance.findMany({
      where: {
        tenantId,
        date: { gte: today, lt: tomorrow },
      },
      include: {
        santri: { select: { name: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    return records.map((r) => ({
      id: r.id,
      santriName: r.santri.name,
      type: r.status,
      timestamp: r.createdAt,
    }));
  }

  async getTodaySchedules(tenantId: string) {
    const today = new Date();
    // JS getDay() returns 0 for Sunday, 1 for Monday...
    // Adjust if needed depending on how dayOfWeek is stored (1=Monday...7=Sunday)
    let dayOfWeek = today.getDay();
    if (dayOfWeek === 0) dayOfWeek = 7; // Assuming 1=Mon, 7=Sun

    return this.prisma.academicSchedule.findMany({
      where: {
        tenantId,
        dayOfWeek,
      },
      orderBy: { startTime: 'asc' },
    });
  }

  async scan(
    tenantId: string,
    santriId: string,
    mode: string = 'HARIAN',
    type?: string,
    scheduleId?: string,
  ) {
    // Verify santri belongs to tenant
    const santri = await this.prisma.santri.findFirst({
      where: { id: santriId, tenantId },
    });

    if (!santri) {
      throw new Error('Santri tidak ditemukan.');
    }

    if (mode === 'MAPEL' && scheduleId) {
      // Find the schedule to ensure it exists
      const schedule = await this.prisma.academicSchedule.findFirst({
        where: { id: scheduleId, tenantId },
      });
      
      if (!schedule) {
        throw new Error('Jadwal Pelajaran tidak valid.');
      }

      return this.prisma.attendance.create({
        data: {
          tenantId,
          santriId,
          scheduleId,
          status: 'HADIR', // Always HADIR for QR Scan in Mapel
          date: new Date(),
          notes: `QR Scan - MAPEL (${schedule.subject})`,
        },
      });
    }

    // Default HARIAN mode
    return this.prisma.attendance.create({
      data: {
        tenantId,
        santriId,
        status: type || 'HADIR',
        date: new Date(),
        notes: `QR Scan - ${type || 'MASUK'}`,
      },
    });
  }
}
