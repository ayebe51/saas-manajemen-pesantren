import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { WaQueueService } from '../wa-engine/wa-queue.service';
import { CreatePpdbDto } from './dto/create-ppdb.dto';
import { UpdatePpdbStatusDto } from './dto/update-ppdb-status.dto';

// ─── State Machine ────────────────────────────────────────────────────────────
// Valid transitions — Requirements: 4.3
const VALID_TRANSITIONS: Record<string, string[]> = {
  DRAFT: ['SUBMITTED'],
  SUBMITTED: ['REVIEW', 'REJECTED'],
  REVIEW: ['ACCEPTED', 'REJECTED'],
  ACCEPTED: [],
  REJECTED: [],
};

@Injectable()
export class PpdbService {
  private readonly logger = new Logger(PpdbService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly waQueue: WaQueueService,
  ) {}

  // ─── Helpers ────────────────────────────────────────────────────────────────

  private assertTransition(current: string, next: string): void {
    const allowed = VALID_TRANSITIONS[current] ?? [];
    if (!allowed.includes(next)) {
      throw new BadRequestException(
        `Transisi status tidak valid: ${current} → ${next}`,
      );
    }
  }

  private async findOrFail(id: string) {
    const record = await this.prisma.ppdbPendaftaran.findUnique({ where: { id } });
    if (!record) throw new NotFoundException(`Pendaftaran PPDB ${id} tidak ditemukan`);
    return record;
  }

  /**
   * Generate nomor pendaftaran unik: PPDB-YYYY-XXXXX (zero-padded sequential)
   * Requirements: 4.2
   */
  private async generateNomorPendaftaran(tenantId: string): Promise<string> {
    const year = new Date().getFullYear();
    const prefix = `PPDB-${year}-`;

    // Count existing registrations for this year+tenant to get sequential number
    const count = await this.prisma.ppdbPendaftaran.count({
      where: {
        tenantId,
        nomorPendaftaran: { startsWith: prefix },
      },
    });

    return `${prefix}${(count + 1).toString().padStart(5, '0')}`;
  }

  /**
   * Generate NIS untuk santri baru: NIS-YYYY-XXXXX
   */
  private async generateNis(tenantId: string): Promise<string> {
    const year = new Date().getFullYear();
    const prefix = `NIS-${year}-`;

    const count = await this.prisma.santri.count({
      where: {
        tenantId,
        nis: { startsWith: prefix },
        deletedAt: null,
      },
    });

    return `${prefix}${(count + 1).toString().padStart(5, '0')}`;
  }

  /** Kirim notifikasi WA ke wali calon santri */
  private notifyWali(
    noHpWali: string,
    nomorPendaftaran: string,
    namaLengkap: string,
    status: string,
  ): void {
    if (!noHpWali) return;
    this.waQueue.enqueue({
      tipeNotifikasi: 'ppdb',
      noTujuan: noHpWali,
      templateKey: `PPDB_${status}`,
      payload: {
        nomorPendaftaran,
        namaCalon: namaLengkap,
        status,
      },
    });
  }

  // ─── CRUD ────────────────────────────────────────────────────────────────────

  /**
   * Buat pendaftaran baru dengan status DRAFT.
   * Generate nomor pendaftaran unik.
   * Requirements: 4.1, 4.2
   */
  async create(tenantId: string, dto: CreatePpdbDto) {
    const nomorPendaftaran = await this.generateNomorPendaftaran(tenantId);

    const record = await this.prisma.ppdbPendaftaran.create({
      data: {
        tenantId,
        nomorPendaftaran,
        dataCalon: dto.dataCalon,
        catatan: dto.catatan ?? null,
        status: 'DRAFT',
      },
    });

    this.logger.log(`[PPDB] Pendaftaran baru dibuat: ${nomorPendaftaran}`);
    return record;
  }

  /**
   * Submit pendaftaran: DRAFT → SUBMITTED, kirim notifikasi WA.
   * Requirements: 4.2, 4.4
   */
  async submit(id: string) {
    const record = await this.findOrFail(id);
    this.assertTransition(record.status, 'SUBMITTED');

    const updated = await this.prisma.ppdbPendaftaran.update({
      where: { id },
      data: { status: 'SUBMITTED', updatedAt: new Date() },
    });

    const data = record.dataCalon as Record<string, any>;
    this.notifyWali(
      data.no_hp_wali,
      record.nomorPendaftaran,
      data.nama_lengkap,
      'SUBMITTED',
    );

    return updated;
  }

  /**
   * Update status oleh admin: SUBMITTED → REVIEW → ACCEPTED/REJECTED.
   * Kirim notifikasi WA pada setiap perubahan status.
   * Requirements: 4.3, 4.4
   */
  async updateStatus(id: string, dto: UpdatePpdbStatusDto) {
    const record = await this.findOrFail(id);
    this.assertTransition(record.status, dto.status);

    const now = new Date();
    const updated = await this.prisma.ppdbPendaftaran.update({
      where: { id },
      data: {
        status: dto.status,
        catatan: dto.catatan ?? record.catatan,
        reviewedBy: dto.reviewedBy ?? record.reviewedBy,
        reviewedAt: now,
        updatedAt: now,
      },
    });

    const data = record.dataCalon as Record<string, any>;
    this.notifyWali(
      data.no_hp_wali,
      record.nomorPendaftaran,
      data.nama_lengkap,
      dto.status,
    );

    return updated;
  }

  /**
   * Konversi pendaftaran ACCEPTED menjadi data santri aktif.
   * Tidak boleh dikonversi ulang jika sudah ada santriId.
   * Requirements: 4.5
   */
  async convertToSantri(id: string, tenantId: string) {
    const record = await this.findOrFail(id);

    if (record.status !== 'ACCEPTED') {
      throw new BadRequestException(
        `Hanya pendaftaran dengan status ACCEPTED yang dapat dikonversi. Status saat ini: ${record.status}`,
      );
    }

    if (record.santriId) {
      throw new ConflictException(
        `Pendaftaran ini sudah dikonversi menjadi santri (ID: ${record.santriId})`,
      );
    }

    const data = record.dataCalon as Record<string, any>;
    const nis = await this.generateNis(tenantId);
    const now = new Date();

    const santri = await this.prisma.$transaction(async (tx) => {
      const newSantri = await tx.santri.create({
        data: {
          tenantId,
          nis,
          namaLengkap: data.nama_lengkap,
          name: data.nama_lengkap,
          gender: data.jenis_kelamin ?? 'L',
          jenisKelamin: data.jenis_kelamin ?? 'L',
          tanggalLahir: data.tanggal_lahir ? new Date(data.tanggal_lahir) : null,
          dob: data.tanggal_lahir ? new Date(data.tanggal_lahir) : null,
          tempatLahir: data.tempat_lahir ?? null,
          alamat: data.alamat ?? null,
          address: data.alamat ?? null,
          fotoUrl: data.foto_url ?? null,
          photo: data.foto_url ?? null,
          tanggalMasuk: now,
          status: 'AKTIF',
        },
      });

      await tx.ppdbPendaftaran.update({
        where: { id },
        data: { santriId: newSantri.id, updatedAt: now },
      });

      return newSantri;
    });

    this.logger.log(
      `[PPDB] Pendaftaran ${record.nomorPendaftaran} dikonversi ke santri NIS: ${nis}`,
    );

    return santri;
  }

  /**
   * Daftar semua pendaftaran dengan filter opsional.
   * Requirements: 4.1
   */
  async findAll(tenantId: string, status?: string) {
    const where: any = { tenantId };
    if (status) where.status = status;

    const [data, total] = await Promise.all([
      this.prisma.ppdbPendaftaran.findMany({
        where,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.ppdbPendaftaran.count({ where }),
    ]);

    return { data, meta: { total } };
  }

  /**
   * Detail satu pendaftaran.
   * Requirements: 4.1
   */
  async findOne(id: string) {
    return this.findOrFail(id);
  }
}
