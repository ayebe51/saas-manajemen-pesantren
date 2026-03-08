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

  async scan(tenantId: string, santriId: string, type: string) {
    // Verify santri belongs to tenant
    const santri = await this.prisma.santri.findFirst({
      where: { id: santriId, tenantId },
    });

    if (!santri) {
      throw new Error('Santri tidak ditemukan.');
    }

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
