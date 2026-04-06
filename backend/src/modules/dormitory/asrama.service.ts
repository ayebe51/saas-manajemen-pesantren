import {
  HttpException,
  HttpStatus,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { CreateAsramaDto } from './dto/create-asrama.dto';
import { CreateKamarDto } from './dto/create-kamar.dto';
import { UpdateKamarDto } from './dto/update-kamar.dto';
import { AssignSantriDto } from './dto/assign-santri.dto';

@Injectable()
export class AsramaService {
  constructor(private readonly prisma: PrismaService) {}

  // ─── Asrama ──────────────────────────────────────────────────────────────────

  /** Buat gedung asrama baru — Requirement 15.1 */
  async createAsrama(tenantId: string, dto: CreateAsramaDto) {
    return this.prisma.asrama.create({
      data: { tenantId, nama: dto.nama, deskripsi: dto.deskripsi },
    });
  }

  /** Daftar semua asrama beserta kamar-kamarnya — Requirement 15.1 */
  async findAllAsrama(tenantId: string) {
    return this.prisma.asrama.findMany({
      where: { tenantId },
      include: {
        kamar: {
          include: {
            _count: { select: { penempatan: { where: { isAktif: true } } } },
          },
          orderBy: [{ lantai: 'asc' }, { nama: 'asc' }],
        },
      },
      orderBy: { nama: 'asc' },
    });
  }

  // ─── Kamar ───────────────────────────────────────────────────────────────────

  /** Buat kamar baru di dalam asrama — Requirement 15.1 */
  async createKamar(tenantId: string, dto: CreateKamarDto) {
    // Pastikan asrama milik tenant ini
    const asrama = await this.prisma.asrama.findFirst({
      where: { id: dto.asramaId, tenantId },
    });
    if (!asrama) throw new NotFoundException('Asrama tidak ditemukan');

    return this.prisma.kamar.create({
      data: {
        asramaId: dto.asramaId,
        nama: dto.nama,
        kapasitas: dto.kapasitas,
        lantai: dto.lantai,
        status: dto.status ?? 'TERSEDIA',
      },
    });
  }

  /** Daftar kamar, opsional filter by asramaId — Requirement 15.1 */
  async findAllKamar(tenantId: string, asramaId?: string) {
    const where: any = { asrama: { tenantId } };
    if (asramaId) where.asramaId = asramaId;

    return this.prisma.kamar.findMany({
      where,
      include: {
        asrama: { select: { id: true, nama: true } },
        _count: { select: { penempatan: { where: { isAktif: true } } } },
      },
      orderBy: [{ asramaId: 'asc' }, { lantai: 'asc' }, { nama: 'asc' }],
    });
  }

  /** Update data kamar — Requirement 15.1 */
  async updateKamar(tenantId: string, kamarId: string, dto: UpdateKamarDto) {
    const kamar = await this.prisma.kamar.findFirst({
      where: { id: kamarId, asrama: { tenantId } },
    });
    if (!kamar) throw new NotFoundException('Kamar tidak ditemukan');

    return this.prisma.kamar.update({
      where: { id: kamarId },
      data: {
        ...(dto.nama !== undefined && { nama: dto.nama }),
        ...(dto.kapasitas !== undefined && { kapasitas: dto.kapasitas }),
        ...(dto.lantai !== undefined && { lantai: dto.lantai }),
        ...(dto.status !== undefined && { status: dto.status }),
      },
    });
  }

  // ─── Penempatan Santri ────────────────────────────────────────────────────────

  /**
   * Tempatkan santri ke kamar.
   * - Validasi kapasitas (Requirement 15.2, 15.3)
   * - Tutup penempatan aktif sebelumnya (Requirement 15.4)
   * - Catat dengan server timestamp (Requirement 15.4)
   */
  async assignSantri(tenantId: string, dto: AssignSantriDto) {
    // Validasi kamar milik tenant
    const kamar = await this.prisma.kamar.findFirst({
      where: { id: dto.kamarId, asrama: { tenantId } },
    });
    if (!kamar) throw new NotFoundException('Kamar tidak ditemukan');

    // Validasi santri milik tenant
    const santri = await this.prisma.santri.findFirst({
      where: { id: dto.santriId, tenantId, deletedAt: null },
    });
    if (!santri) throw new NotFoundException('Santri tidak ditemukan');

    // Hitung penghuni aktif saat ini — Requirement 15.2
    const jumlahAktif = await this.prisma.penempatanSantri.count({
      where: { kamarId: dto.kamarId, isAktif: true },
    });

    // Tolak jika kamar penuh — Requirement 15.3
    if (jumlahAktif >= kamar.kapasitas) {
      throw new HttpException(
        `Kamar ${kamar.nama} sudah penuh (kapasitas: ${kamar.kapasitas})`,
        HttpStatus.UNPROCESSABLE_ENTITY,
      );
    }

    const now = new Date();
    const tanggalMasuk = dto.tanggalMasuk ? new Date(dto.tanggalMasuk) : now;

    // Tutup penempatan aktif sebelumnya — Requirement 15.4
    await this.prisma.penempatanSantri.updateMany({
      where: { santriId: dto.santriId, isAktif: true },
      data: { tanggalKeluar: now, isAktif: false },
    });

    // Buat penempatan baru dengan server timestamp — Requirement 15.4
    const penempatan = await this.prisma.penempatanSantri.create({
      data: {
        santriId: dto.santriId,
        kamarId: dto.kamarId,
        tanggalMasuk,
        isAktif: true,
      },
      include: {
        santri: { select: { id: true, name: true, nis: true } },
        kamar: { select: { id: true, nama: true, asrama: { select: { nama: true } } } },
      },
    });

    // Update status kamar jika sudah penuh
    const newCount = jumlahAktif + 1;
    if (newCount >= kamar.kapasitas) {
      await this.prisma.kamar.update({
        where: { id: kamar.id },
        data: { status: 'PENUH' },
      });
    }

    return penempatan;
  }

  /** Riwayat penempatan seorang santri — Requirement 15.4 */
  async findPenempatanBySantri(tenantId: string, santriId: string) {
    // Pastikan santri milik tenant
    const santri = await this.prisma.santri.findFirst({
      where: { id: santriId, tenantId, deletedAt: null },
    });
    if (!santri) throw new NotFoundException('Santri tidak ditemukan');

    return this.prisma.penempatanSantri.findMany({
      where: { santriId },
      include: {
        kamar: {
          select: {
            id: true,
            nama: true,
            lantai: true,
            asrama: { select: { id: true, nama: true } },
          },
        },
      },
      orderBy: { tanggalMasuk: 'desc' },
    });
  }

  /** Penghuni aktif sebuah kamar — Requirement 15.1 */
  async findPenempatanByKamar(tenantId: string, kamarId: string) {
    const kamar = await this.prisma.kamar.findFirst({
      where: { id: kamarId, asrama: { tenantId } },
    });
    if (!kamar) throw new NotFoundException('Kamar tidak ditemukan');

    return this.prisma.penempatanSantri.findMany({
      where: { kamarId, isAktif: true },
      include: {
        santri: { select: { id: true, name: true, nis: true, kelas: true } },
      },
      orderBy: { tanggalMasuk: 'asc' },
    });
  }

  /**
   * Laporan hunian: kapasitas, jumlah penghuni, daftar santri per kamar.
   * Requirement 15.1
   */
  async getLaporanHunian(tenantId: string) {
    const asramaList = await this.prisma.asrama.findMany({
      where: { tenantId },
      include: {
        kamar: {
          include: {
            penempatan: {
              where: { isAktif: true },
              include: {
                santri: { select: { id: true, name: true, nis: true, kelas: true } },
              },
            },
          },
          orderBy: [{ lantai: 'asc' }, { nama: 'asc' }],
        },
      },
      orderBy: { nama: 'asc' },
    });

    return asramaList.map((asrama) => ({
      id: asrama.id,
      nama: asrama.nama,
      deskripsi: asrama.deskripsi,
      kamar: asrama.kamar.map((kamar) => ({
        id: kamar.id,
        nama: kamar.nama,
        lantai: kamar.lantai,
        status: kamar.status,
        kapasitas: kamar.kapasitas,
        jumlahPenghuni: kamar.penempatan.length,
        sisaKapasitas: kamar.kapasitas - kamar.penempatan.length,
        santri: kamar.penempatan.map((p) => p.santri),
      })),
    }));
  }
}
