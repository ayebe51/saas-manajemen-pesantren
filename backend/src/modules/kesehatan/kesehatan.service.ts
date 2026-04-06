import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { WaQueueService } from '../wa-engine/wa-queue.service';
import { CreateRekamMedisDto } from './dto/create-rekam-medis.dto';
import { CreateKunjunganDto } from './dto/create-kunjungan.dto';

@Injectable()
export class KesehatanService {
  private readonly logger = new Logger(KesehatanService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly waQueue: WaQueueService,
  ) {}

  // ─── Rekam Medis ──────────────────────────────────────────────────────────

  /**
   * Ambil rekam medis santri berdasarkan santriId.
   * Requirements: 9.2
   */
  async getRekamMedis(santriId: string) {
    const rekamMedis = await this.prisma.rekamMedis.findUnique({
      where: { santriId },
      include: {
        santri: { select: { id: true, name: true, namaLengkap: true, nis: true } },
      },
    });

    if (!rekamMedis) {
      throw new NotFoundException(`Rekam medis untuk santri ${santriId} tidak ditemukan`);
    }

    return rekamMedis;
  }

  /**
   * Buat atau perbarui rekam medis santri (upsert).
   * Requirements: 9.2
   */
  async upsertRekamMedis(santriId: string, dto: CreateRekamMedisDto, _userId: string) {
    const santri = await this.prisma.santri.findFirst({
      where: { id: santriId, deletedAt: null },
    });

    if (!santri) {
      throw new NotFoundException('Santri tidak ditemukan');
    }

    return this.prisma.rekamMedis.upsert({
      where: { santriId },
      create: {
        santriId,
        riwayatPenyakit: dto.riwayatPenyakit,
        alergi: dto.alergi,
        catatan: dto.catatan,
      },
      update: {
        riwayatPenyakit: dto.riwayatPenyakit,
        alergi: dto.alergi,
        catatan: dto.catatan,
      },
      include: {
        santri: { select: { id: true, name: true, namaLengkap: true, nis: true } },
      },
    });
  }

  // ─── Kunjungan Klinik ─────────────────────────────────────────────────────

  /**
   * Catat kunjungan klinik santri.
   * Jika perlu_perhatian_khusus = true, kirim notifikasi WA ke wali.
   * Requirements: 9.2, 9.3, 9.4
   */
  async createKunjungan(dto: CreateKunjunganDto, userId: string) {
    const santri = await this.prisma.santri.findFirst({
      where: { id: dto.santriId, deletedAt: null },
      include: {
        walis: {
          where: { isPrimary: true },
          include: { wali: true },
          take: 1,
        },
      },
    });

    if (!santri) {
      throw new NotFoundException('Santri tidak ditemukan');
    }

    // Gunakan server timestamp — tidak pernah dari client
    const kunjungan = await this.prisma.kunjunganKlinik.create({
      data: {
        santriId: dto.santriId,
        keluhan: dto.keluhan,
        diagnosis: dto.diagnosis,
        tindakan: dto.tindakan,
        serverTimestamp: new Date(),
        createdBy: userId,
      },
      include: {
        santri: { select: { id: true, name: true, namaLengkap: true, nis: true } },
        creator: { select: { id: true, name: true } },
      },
    });

    // Kirim notifikasi WA ke wali jika perlu perhatian khusus — Requirement 9.3
    if (dto.perlu_perhatian_khusus) {
      const wali = santri.walis[0]?.wali;
      const waliHp = wali?.noHp ?? wali?.phone;

      if (waliHp) {
        this.waQueue.enqueue({
          tipeNotifikasi: 'kesehatan',
          noTujuan: waliHp,
          templateKey: 'KESEHATAN_PERHATIAN_KHUSUS',
          payload: {
            wali_nama: wali?.namaLengkap ?? wali?.name ?? 'Wali',
            santri_nama: santri.namaLengkap ?? santri.name,
            keluhan: dto.keluhan,
            diagnosis: dto.diagnosis ?? '-',
            tindakan: dto.tindakan ?? '-',
            tanggal: new Date().toLocaleDateString('id-ID'),
          },
        });
        this.logger.log(
          `[Kesehatan] Notifikasi perhatian khusus dikirim ke wali santri ${santri.name}`,
        );
      } else {
        this.logger.warn(
          `[Kesehatan] Santri ${santri.name} perlu perhatian khusus tapi wali tidak memiliki nomor HP`,
        );
      }
    }

    return kunjungan;
  }

  /**
   * Ambil semua kunjungan klinik untuk satu santri.
   * Requirements: 9.2
   */
  async getKunjunganBySantri(santriId: string) {
    const santri = await this.prisma.santri.findFirst({
      where: { id: santriId, deletedAt: null },
    });

    if (!santri) {
      throw new NotFoundException('Santri tidak ditemukan');
    }

    return this.prisma.kunjunganKlinik.findMany({
      where: { santriId },
      include: {
        santri: { select: { id: true, name: true, namaLengkap: true, nis: true } },
        creator: { select: { id: true, name: true } },
      },
      orderBy: { serverTimestamp: 'desc' },
    });
  }

  /**
   * Ambil satu kunjungan klinik berdasarkan ID.
   * Requirements: 9.2
   */
  async getKunjunganById(id: string) {
    const kunjungan = await this.prisma.kunjunganKlinik.findUnique({
      where: { id },
      include: {
        santri: { select: { id: true, name: true, namaLengkap: true, nis: true } },
        creator: { select: { id: true, name: true } },
      },
    });

    if (!kunjungan) {
      throw new NotFoundException(`Kunjungan klinik dengan id ${id} tidak ditemukan`);
    }

    return kunjungan;
  }
}
