import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';

@Injectable()
export class WaliPortalService {
  constructor(private readonly prisma: PrismaService) {}

  async findSantriByWaliPhone(phone: string) {
    // Find wali by phone number
    const wali = await this.prisma.wali.findFirst({
      where: { phone },
      include: {
        santris: {
          include: {
            santri: {
              include: {
                tahfidz: {
                  orderBy: { date: 'desc' },
                  take: 10,
                  select: { surah: true, grade: true, date: true },
                },
                pelanggaran: {
                  orderBy: { createdAt: 'desc' },
                  take: 10,
                  select: { category: true, points: true, date: true },
                },
                invoices: {
                  orderBy: { createdAt: 'desc' },
                  take: 10,
                  select: { id: true, amountDue: true, status: true },
                },
                catatanHarian: {
                  orderBy: { createdAt: 'desc' },
                  take: 10,
                  select: { content: true, category: true, createdAt: true },
                },
                _count: {
                  select: { izin: true, pelanggaran: true, invoices: true },
                },
              },
            },
          },
        },
      },
    });

    if (!wali || wali.santris.length === 0) {
      throw new NotFoundException('Data santri tidak ditemukan untuk nomor tersebut.');
    }

    // Flatten the response
    return wali.santris.map((sw) => {
      const s = sw.santri;
      return {
        id: s.id,
        name: s.name,
        nisn: s.nisn,
        kelas: s.kelas,
        room: s.room,
        status: s.status,
        photo: s.photo,
        tahfidz: s.tahfidz,
        pelanggaran: s.pelanggaran,
        invoices: s.invoices.map(inv => ({ 
          description: `Tagihan SPP/Lainnya`, 
          amount: inv.amountDue, 
          status: inv.status 
        })),
        catatan: s.catatanHarian.map(c => ({ 
          content: c.content, 
          type: c.category, 
          createdAt: c.createdAt 
        })),
        _count: s._count,
      };
    });
  }
}
