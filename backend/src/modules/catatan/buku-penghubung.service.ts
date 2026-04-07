import { Injectable, NotFoundException, ForbiddenException, Logger } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { WaQueueService } from '../wa-engine/wa-queue.service';
import { CreateBukuPenghubungDto } from './dto/create-catatan-buku.dto';
import { CreateBalasanDto } from './dto/create-balasan.dto';
import { QueryCatatanDto } from './dto/query-catatan.dto';

@Injectable()
export class BukuPenghubungService {
  private readonly logger = new Logger(BukuPenghubungService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly waQueue: WaQueueService,
  ) {}

  /**
   * Buat entri buku penghubung baru (oleh Wali_Kelas).
   * Setelah dibuat, kirim notifikasi WA ke wali santri.
   * Requirements: 7.1, 7.4
   */
  async create(dto: CreateBukuPenghubungDto, currentUser: { id: string; role: string }) {
    const santri = await this.prisma.santri.findFirst({
      where: { id: dto.santri_id, deletedAt: null },
      include: {
        walis: {
          include: { wali: true },
        },
      },
    });

    if (!santri) {
      throw new NotFoundException(`Santri ${dto.santri_id} tidak ditemukan`);
    }

    const entry = await this.prisma.bukuPenghubung.create({
      data: {
        santriId: dto.santri_id,
        waliKelasId: currentUser.id,
        isi: dto.isi,
        serverTimestamp: new Date(),
      },
      include: {
        santri: { select: { name: true, nis: true } },
        waliKelas: { select: { name: true } },
      },
    });

    // Kirim notifikasi WA ke semua wali santri — Requirement 7.4
    for (const sw of santri.walis) {
      const phone = sw.wali?.noHp ?? sw.wali?.phone;
      if (!phone) continue;
      this.waQueue.enqueue({
        tipeNotifikasi: 'buku_penghubung',
        noTujuan: phone,
        templateKey: 'BUKU_PENGHUBUNG_BARU',
        payload: {
          namaSantri: santri.name,
          namaWaliKelas: entry.waliKelas.name,
          isi: dto.isi,
        },
      });
    }

    return entry;
  }

  /**
   * Daftar semua entri buku penghubung dengan pagination dan filter.
   * Requirements: 7.1
   */
  async findAll(query: QueryCatatanDto) {
    const { santri_id, wali_kelas_id, page = 1, limit = 20 } = query;
    const where: any = {};

    if (santri_id) where.santriId = santri_id;
    if (wali_kelas_id) where.waliKelasId = wali_kelas_id;

    const [data, total] = await Promise.all([
      this.prisma.bukuPenghubung.findMany({
        where,
        include: {
          santri: { select: { name: true, nis: true, kelas: true } },
          waliKelas: { select: { name: true } },
          _count: { select: { balasan: true } },
        },
        orderBy: { serverTimestamp: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.bukuPenghubung.count({ where }),
    ]);

    return { data, meta: { total, page, limit } };
  }

  /**
   * Detail satu entri buku penghubung beserta balasannya.
   * Requirements: 7.1
   */
  async findOne(id: string) {
    const entry = await this.prisma.bukuPenghubung.findUnique({
      where: { id },
      include: {
        santri: { select: { name: true, nis: true, kelas: true } },
        waliKelas: { select: { name: true } },
        balasan: {
          include: { penulis: { select: { name: true, role: true } } },
          orderBy: { serverTimestamp: 'asc' },
        },
      },
    });

    if (!entry) {
      throw new NotFoundException(`Buku penghubung ${id} tidak ditemukan`);
    }

    return entry;
  }

  /**
   * Buat balasan untuk entri buku penghubung.
   * Setelah dibuat, kirim notifikasi WA ke wali kelas.
   * Requirements: 7.1, 7.4
   */
  async createReply(
    bukuPenghubungId: string,
    dto: CreateBalasanDto,
    currentUser: { id: string; role: string },
  ) {
    const entry = await this.prisma.bukuPenghubung.findUnique({
      where: { id: bukuPenghubungId },
      include: {
        santri: { select: { name: true } },
        waliKelas: { select: { name: true, phone: true } },
      },
    });

    if (!entry) {
      throw new NotFoundException(`Buku penghubung ${bukuPenghubungId} tidak ditemukan`);
    }

    const balasan = await this.prisma.balasanBukuPenghubung.create({
      data: {
        bukuPenghubungId,
        penulisId: currentUser.id,
        isi: dto.isi,
        serverTimestamp: new Date(),
      },
      include: {
        penulis: { select: { name: true, role: true } },
      },
    });

    // Kirim notifikasi WA ke wali kelas jika yang membalas bukan wali kelas itu sendiri — Requirement 7.4
    if (currentUser.id !== entry.waliKelasId) {
      const waliKelasPhone = entry.waliKelas?.phone;
      if (waliKelasPhone) {
        this.waQueue.enqueue({
          tipeNotifikasi: 'buku_penghubung',
          noTujuan: waliKelasPhone,
          templateKey: 'BALASAN_BUKU_PENGHUBUNG',
          payload: {
            namaSantri: entry.santri.name,
            namaPenulis: balasan.penulis.name,
            isi: dto.isi,
          },
        });
      }
    }

    return balasan;
  }

  /**
   * Ambil semua balasan untuk satu entri buku penghubung.
   * Requirements: 7.1
   */
  async findReplies(bukuPenghubungId: string) {
    const entry = await this.prisma.bukuPenghubung.findUnique({
      where: { id: bukuPenghubungId },
      select: { id: true },
    });

    if (!entry) {
      throw new NotFoundException(`Buku penghubung ${bukuPenghubungId} tidak ditemukan`);
    }

    return this.prisma.balasanBukuPenghubung.findMany({
      where: { bukuPenghubungId },
      include: {
        penulis: { select: { name: true, role: true } },
      },
      orderBy: { serverTimestamp: 'asc' },
    });
  }
}
