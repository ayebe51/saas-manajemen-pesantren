import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import {
  CreateBulkAttendanceDto,
  CreateGradeDto,
  CreateJadwalDto,
  CreateKelasDto,
  CreateMapelDto,
  CreateNilaiDto,
  CreateScheduleDto,
  UpdateKelasDto,
  UpdateMapelDto,
  UpdateNilaiDto,
} from './dto/academic.dto';

// Configurable nilai range — Requirement 6.2
const NILAI_MIN = 0;
const NILAI_MAX = 100;

interface NaikKelasMapping {
  kelasAsalId: string;
  kelasTujuanId?: string;
}

interface NaikKelasDto {
  mappings: NaikKelasMapping[];
}

export interface NaikKelasPreviewItem {
  kelasAsal: string;
  kelasTujuan: string | null;
  aksi: 'NAIK_KELAS' | 'PROMOSI';
  santri: { id: string; name: string; nisn: string | null; nis: string | null; kelas: string | null }[];
}

@Injectable()
export class AcademicService {
  private readonly logger = new Logger(AcademicService.name);

  constructor(private readonly prisma: PrismaService) {}

  // ─── Kelas ──────────────────────────────────────────────────────────────────

  async createKelas(tenantId: string, dto: CreateKelasDto) {
    return this.prisma.kelas.create({
      data: {
        tenantId,
        nama: dto.nama,
        tingkat: Number(dto.tingkat),
        rombel: (dto as any).rombel ?? null,
        kapasitas: (dto as any).kapasitas ?? 30,
        isTertinggi: (dto as any).isTertinggi ?? false,
        waliKelasId: dto.waliKelasId ?? null,
        tahunAjaran: dto.tahunAjaran ?? null,
      },
    });
  }

  async deleteKelas(tenantId: string, kelasId: string) {
    await this.findKelasOrThrow(tenantId, kelasId);
    await this.prisma.kelas.update({
      where: { id: kelasId },
      data: { isActive: false },
    });
    return { message: 'Kelas berhasil dinonaktifkan' };
  }

  /**
   * Preview naik kelas massal — tampilkan santri yang akan terdampak
   */
  async previewNaikKelas(tenantId: string, dto: NaikKelasDto) {
    const results: NaikKelasPreviewItem[] = [];

    for (const mapping of dto.mappings) {
      const kelasAsal = await this.findKelasOrThrow(tenantId, mapping.kelasAsalId);
      const santriList = await this.prisma.santri.findMany({
        where: { tenantId, kelas: kelasAsal.nama, deletedAt: null, status: 'AKTIF' },
        select: { id: true, name: true, nisn: true, nis: true, kelas: true },
      });

      if (kelasAsal.isTertinggi) {
        results.push({
          kelasAsal: kelasAsal.nama,
          kelasTujuan: null,
          aksi: 'PROMOSI',
          santri: santriList,
        });
      } else {
        const kelasTujuan = mapping.kelasTujuanId
          ? await this.findKelasOrThrow(tenantId, mapping.kelasTujuanId)
          : null;
        results.push({
          kelasAsal: kelasAsal.nama,
          kelasTujuan: kelasTujuan?.nama ?? null,
          aksi: 'NAIK_KELAS',
          santri: santriList,
        });
      }
    }

    return results;
  }

  /**
   * Eksekusi naik kelas massal
   * - Santri di kelas biasa → pindah ke kelas tujuan
   * - Santri di kelas tertinggi → promosi jadi Pengurus + status ALUMNI
   */
  async eksekusiNaikKelas(tenantId: string, dto: NaikKelasDto, userId: string) {
    let totalNaik = 0;
    let totalPromosi = 0;
    const errors: string[] = [];

    for (const mapping of dto.mappings) {
      const kelasAsal = await this.findKelasOrThrow(tenantId, mapping.kelasAsalId);
      const santriList = await this.prisma.santri.findMany({
        where: { tenantId, kelas: kelasAsal.nama, deletedAt: null, status: 'AKTIF' },
      });

      if (kelasAsal.isTertinggi) {
        // Promosi santri di kelas tertinggi
        for (const santri of santriList) {
          try {
            await this.prisma.santri.update({
              where: { id: santri.id },
              data: { status: 'ALUMNI' },
            });

            // Buat akun user Pengurus jika belum ada
            const email = `${santri.nisn || santri.nis || santri.id.substring(0, 8)}@pesantren.internal`;
            const existingUser = await this.prisma.user.findFirst({ where: { email } });
            if (!existingUser) {
              const bcrypt = await import('bcrypt');
              const defaultPass = santri.nisn || santri.nis || santri.id.substring(0, 8);
              const passwordHash = await bcrypt.hash(defaultPass, 10);
              await this.prisma.user.create({
                data: { tenantId, email, name: santri.name, passwordHash, role: 'PENGURUS', isActive: true },
              });
            }
            totalPromosi++;
          } catch (e: any) {
            errors.push(`${santri.name}: ${e.message}`);
          }
        }
      } else {
        // Naik kelas biasa
        if (!mapping.kelasTujuanId) {
          errors.push(`Kelas ${kelasAsal.nama}: kelasTujuanId wajib diisi`);
          continue;
        }
        const kelasTujuan = await this.findKelasOrThrow(tenantId, mapping.kelasTujuanId);

        for (const santri of santriList) {
          try {
            await this.prisma.santri.update({
              where: { id: santri.id },
              data: { kelas: kelasTujuan.nama },
            });
            totalNaik++;
          } catch (e: any) {
            errors.push(`${santri.name}: ${e.message}`);
          }
        }
      }
    }

    return {
      message: 'Proses naik kelas selesai',
      totalNaik,
      totalPromosi,
      errors,
    };
  }

  async getKelasList(tenantId: string, tahunAjaran?: string) {
    return this.prisma.kelas.findMany({
      where: {
        tenantId,
        isActive: true,
        ...(tahunAjaran ? { tahunAjaran } : {}),
      },
      orderBy: [{ tingkat: 'asc' }, { nama: 'asc' }],
    });
  }

  async updateKelas(tenantId: string, kelasId: string, dto: UpdateKelasDto) {
    await this.findKelasOrThrow(tenantId, kelasId);
    return this.prisma.kelas.update({
      where: { id: kelasId },
      data: {
        ...dto,
        ...(dto.tingkat !== undefined && { tingkat: Number(dto.tingkat) }),
      },
    });
  }

  // ─── Mata Pelajaran ──────────────────────────────────────────────────────────

  async createMapel(tenantId: string, dto: CreateMapelDto) {
    return this.prisma.mataPelajaran.create({
      data: {
        tenantId,
        nama: dto.nama,
        kode: dto.kode,
        deskripsi: dto.deskripsi,
      },
    });
  }

  async getMapelList(tenantId: string) {
    return this.prisma.mataPelajaran.findMany({
      where: { tenantId, isActive: true },
      orderBy: { nama: 'asc' },
    });
  }

  async updateMapel(tenantId: string, mapelId: string, dto: UpdateMapelDto) {
    await this.findMapelOrThrow(tenantId, mapelId);
    return this.prisma.mataPelajaran.update({
      where: { id: mapelId },
      data: dto,
    });
  }

  // ─── Jadwal Pelajaran ────────────────────────────────────────────────────────

  async createJadwal(tenantId: string, dto: CreateJadwalDto) {
    await this.findKelasOrThrow(tenantId, dto.kelasId);
    await this.findMapelOrThrow(tenantId, dto.mapelId);

    // Requirement 6.4: Validasi konflik jadwal untuk kelas dan pengajar yang sama
    await this.validateJadwalKonflik(tenantId, dto);

    return this.prisma.jadwalPelajaran.create({
      data: {
        tenantId,
        kelasId: dto.kelasId,
        mapelId: dto.mapelId,
        pengajarId: dto.pengajarId,
        hariKe: dto.hariKe,
        jamMulai: dto.jamMulai,
        jamSelesai: dto.jamSelesai,
        ruangan: dto.ruangan,
      },
      include: {
        kelas: true,
        mapel: true,
      },
    });
  }

  async getJadwalByKelas(tenantId: string, kelasId: string) {
    await this.findKelasOrThrow(tenantId, kelasId);
    return this.prisma.jadwalPelajaran.findMany({
      where: { tenantId, kelasId },
      include: { mapel: true },
      orderBy: [{ hariKe: 'asc' }, { jamMulai: 'asc' }],
    });
  }

  async deleteJadwal(tenantId: string, jadwalId: string) {
    const jadwal = await this.prisma.jadwalPelajaran.findFirst({
      where: { id: jadwalId, tenantId },
    });
    if (!jadwal) throw new NotFoundException('Jadwal tidak ditemukan');
    await this.prisma.jadwalPelajaran.delete({ where: { id: jadwalId } });
    return { message: 'Jadwal berhasil dihapus' };
  }

  // ─── Nilai Santri ────────────────────────────────────────────────────────────

  async createNilai(tenantId: string, userId: string, dto: CreateNilaiDto) {
    // Requirement 6.2: Validasi nilai dalam rentang 0–100
    this.validateNilaiRange(dto.nilai);

    const santri = await this.prisma.santri.findFirst({
      where: { id: dto.santriId, tenantId, deletedAt: null },
    });
    if (!santri) throw new NotFoundException('Santri tidak ditemukan');

    await this.findMapelOrThrow(tenantId, dto.mapelId);

    if (dto.kelasId) {
      await this.findKelasOrThrow(tenantId, dto.kelasId);
    }

    return this.prisma.nilaiSantri.create({
      data: {
        tenantId,
        santriId: dto.santriId,
        mapelId: dto.mapelId,
        kelasId: dto.kelasId,
        periode: dto.periode,
        tipeNilai: dto.tipeNilai,
        nilai: dto.nilai,
        keterangan: dto.keterangan,
        createdBy: userId,
      },
      include: {
        mapel: true,
        kelas: true,
      },
    });
  }

  async updateNilai(tenantId: string, nilaiId: string, dto: UpdateNilaiDto) {
    const existing = await this.prisma.nilaiSantri.findFirst({
      where: { id: nilaiId, tenantId },
    });
    if (!existing) throw new NotFoundException('Data nilai tidak ditemukan');

    if (dto.nilai !== undefined) {
      this.validateNilaiRange(dto.nilai);
    }

    return this.prisma.nilaiSantri.update({
      where: { id: nilaiId },
      data: dto,
      include: { mapel: true, kelas: true },
    });
  }

  async getNilaiBySantri(
    tenantId: string,
    santriId: string,
    periode?: string,
    mapelId?: string,
  ) {
    const santri = await this.prisma.santri.findFirst({
      where: { id: santriId, tenantId, deletedAt: null },
    });
    if (!santri) throw new NotFoundException('Santri tidak ditemukan');

    return this.prisma.nilaiSantri.findMany({
      where: {
        tenantId,
        santriId,
        ...(periode ? { periode } : {}),
        ...(mapelId ? { mapelId } : {}),
      },
      include: { mapel: true, kelas: true },
      orderBy: [{ periode: 'desc' }, { createdAt: 'desc' }],
    });
  }

  async getRekap(tenantId: string, santriId: string, periode: string) {
    const nilaiList = await this.prisma.nilaiSantri.findMany({
      where: { tenantId, santriId, periode },
      include: { mapel: true },
      orderBy: { mapel: { nama: 'asc' } },
    });

    // Group by mapel and compute average per mapel
    const grouped = nilaiList.reduce<Record<string, { mapel: string; nilai: number[] }>>(
      (acc, n) => {
        const key = n.mapelId;
        if (!acc[key]) acc[key] = { mapel: n.mapel.nama, nilai: [] };
        acc[key].nilai.push(Number(n.nilai));
        return acc;
      },
      {},
    );

    return Object.values(grouped).map((g) => ({
      mapel: g.mapel,
      rataRata: g.nilai.reduce((a, b) => a + b, 0) / g.nilai.length,
      detail: g.nilai,
    }));
  }

  // ─── Legacy methods (backward compatibility) ─────────────────────────────────

  async createSchedule(tenantId: string, dto: CreateScheduleDto) {
    return this.prisma.academicSchedule.create({
      data: {
        tenantId,
        subject: dto.subject,
        teacherId: dto.teacherId,
        kelas: dto.kelas,
        dayOfWeek: dto.dayOfWeek,
        startTime: dto.startTime,
        endTime: dto.endTime,
        room: dto.room,
      },
    });
  }

  async getScheduleByKelas(tenantId: string, kelas: string) {
    return this.prisma.academicSchedule.findMany({
      where: { tenantId, kelas },
      orderBy: [{ dayOfWeek: 'asc' }, { startTime: 'asc' }],
    });
  }

  async recordAttendance(tenantId: string, userId: string, dto: CreateBulkAttendanceDto) {
    const targetDate = dto.date ? new Date(dto.date) : new Date();
    targetDate.setHours(0, 0, 0, 0);

    const attendances = dto.attendances.map((a) => ({
      tenantId,
      santriId: a.santriId,
      scheduleId: dto.scheduleId,
      date: targetDate,
      status: a.status,
      notes: a.notes,
      recordedBy: userId,
    }));

    return this.prisma.attendance.createMany({ data: attendances });
  }

  async getAttendanceReport(tenantId: string, santriId: string) {
    return this.prisma.attendance.findMany({
      where: { tenantId, santriId },
      orderBy: { date: 'desc' },
      take: 30,
    });
  }

  async createGrade(tenantId: string, dto: CreateGradeDto) {
    const santri = await this.prisma.santri.findFirst({
      where: { id: dto.santriId, tenantId },
    });
    if (!santri) throw new NotFoundException('Santri not found');

    // Requirement 6.2: validate score range
    this.validateNilaiRange(dto.score);

    return this.prisma.grade.create({
      data: {
        tenantId,
        santriId: dto.santriId,
        subject: dto.subject,
        semester: dto.semester,
        academicYear: dto.academicYear,
        type: dto.type,
        score: dto.score,
        notes: dto.notes,
      },
    });
  }

  async getGradeReport(
    tenantId: string,
    santriId: string,
    semester?: string,
    academicYear?: string,
  ) {
    const where: Record<string, unknown> = { tenantId, santriId };
    if (semester) where.semester = semester;
    if (academicYear) where.academicYear = academicYear;

    return this.prisma.grade.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });
  }

  // ─── Private helpers ─────────────────────────────────────────────────────────

  private validateNilaiRange(nilai: number) {
    if (nilai < NILAI_MIN || nilai > NILAI_MAX) {
      throw new BadRequestException(
        `Nilai harus berada dalam rentang ${NILAI_MIN}–${NILAI_MAX}`,
      );
    }
  }

  private async findKelasOrThrow(tenantId: string, kelasId: string) {
    const kelas = await this.prisma.kelas.findFirst({
      where: { id: kelasId, tenantId },
    });
    if (!kelas) throw new NotFoundException('Kelas tidak ditemukan');
    return kelas;
  }

  private async findMapelOrThrow(tenantId: string, mapelId: string) {
    const mapel = await this.prisma.mataPelajaran.findFirst({
      where: { id: mapelId, tenantId },
    });
    if (!mapel) throw new NotFoundException('Mata pelajaran tidak ditemukan');
    return mapel;
  }

  /**
   * Requirement 6.4: Validasi konflik jadwal untuk kelas dan pengajar yang sama.
   * Konflik terjadi jika pada hari yang sama, jam mulai/selesai overlap.
   */
  private async validateJadwalKonflik(tenantId: string, dto: CreateJadwalDto) {
    const existing = await this.prisma.jadwalPelajaran.findMany({
      where: {
        tenantId,
        hariKe: dto.hariKe,
        OR: [{ kelasId: dto.kelasId }, { pengajarId: dto.pengajarId }],
      },
    });

    for (const jadwal of existing) {
      if (this.isTimeOverlap(dto.jamMulai, dto.jamSelesai, jadwal.jamMulai, jadwal.jamSelesai)) {
        const konflikTarget = jadwal.kelasId === dto.kelasId ? 'kelas' : 'pengajar';
        throw new BadRequestException(
          `Konflik jadwal: ${konflikTarget} sudah memiliki jadwal pada hari dan jam yang sama`,
        );
      }
    }
  }

  private isTimeOverlap(
    startA: string,
    endA: string,
    startB: string,
    endB: string,
  ): boolean {
    const toMinutes = (t: string) => {
      const [h, m] = t.split(':').map(Number);
      return h * 60 + m;
    };
    const sA = toMinutes(startA);
    const eA = toMinutes(endA);
    const sB = toMinutes(startB);
    const eB = toMinutes(endB);
    return sA < eB && eA > sB;
  }
}
