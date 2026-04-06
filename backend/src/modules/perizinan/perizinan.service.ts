import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { AuditLogService } from '../audit-log/audit-log.service';
import { WaQueueService } from '../wa-engine/wa-queue.service';
import { CreatePerizinanDto } from './dto/create-perizinan.dto';
import { QueryPerizinanDto } from './dto/query-perizinan.dto';

// ─── State Machine ────────────────────────────────────────────────────────────
// Valid transitions — Requirements: 14.1
const VALID_TRANSITIONS: Record<string, string[]> = {
  DRAFT: ['SUBMITTED', 'CANCELLED'],
  SUBMITTED: ['APPROVED', 'REJECTED', 'CANCELLED'],
  APPROVED: ['COMPLETED', 'TERLAMBAT'],
  TERLAMBAT: ['COMPLETED'],
  REJECTED: [],
  COMPLETED: [],
  CANCELLED: [],
};

@Injectable()
export class PerizinanService {
  private readonly logger = new Logger(PerizinanService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly auditLog: AuditLogService,
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

  private async findOrFail(id: string, tenantId: string) {
    const perizinan = await this.prisma.perizinan.findFirst({
      where: { id, tenantId },
      include: {
        santri: {
          include: {
            walis: { include: { wali: true } },
          },
        },
      },
    });
    if (!perizinan) throw new NotFoundException(`Perizinan ${id} tidak ditemukan`);
    return perizinan;
  }

  /** Kirim notifikasi WA ke wali santri */
  private notifyWali(
    perizinan: any,
    templateKey: string,
    extraPayload: Record<string, string | number> = {},
  ): void {
    const walis: any[] = perizinan.santri?.walis ?? [];
    for (const sw of walis) {
      const phone = sw.wali?.noHp ?? sw.wali?.phone;
      if (!phone) continue;
      this.waQueue.enqueue({
        tipeNotifikasi: 'izin',
        noTujuan: phone,
        templateKey,
        payload: {
          namaSantri: perizinan.santri?.name ?? '',
          tipe: perizinan.tipe,
          tanggalMulai: perizinan.tanggalMulai.toISOString(),
          tanggalSelesai: perizinan.tanggalSelesai.toISOString(),
          status: perizinan.status,
          ...extraPayload,
        },
      });
    }
  }

  // ─── CRUD ────────────────────────────────────────────────────────────────────

  /**
   * Buat perizinan baru dengan status DRAFT.
   * Requirements: 14.1, 14.2
   */
  async create(dto: CreatePerizinanDto, userId: string, tenantId: string) {
    const santri = await this.prisma.santri.findFirst({
      where: { id: dto.santriId, tenantId, deletedAt: null },
    });
    if (!santri) throw new NotFoundException('Santri tidak ditemukan');

    const perizinan = await this.prisma.perizinan.create({
      data: {
        tenantId,
        santriId: dto.santriId,
        tipe: dto.tipe,
        alasan: dto.alasan,
        tanggalMulai: new Date(dto.tanggalMulai),
        tanggalSelesai: new Date(dto.tanggalSelesai),
        status: 'DRAFT',
        createdBy: userId,
      },
      include: { santri: { select: { name: true, nis: true } } },
    });

    await this.auditLog.log({
      userId,
      aksi: 'CREATE_PERIZINAN',
      modul: 'perizinan',
      entitasId: perizinan.id,
      entitasTipe: 'Perizinan',
      nilaiAfter: { status: 'DRAFT', tipe: dto.tipe, santriId: dto.santriId },
    });

    return perizinan;
  }

  /**
   * Daftar perizinan dengan filter.
   * Requirements: 14.2
   */
  async findAll(tenantId: string, query: QueryPerizinanDto) {
    const { santriId, status, tanggalDari, tanggalSampai, page = 1, limit = 20 } = query;
    const where: any = { tenantId };

    if (santriId) where.santriId = santriId;
    if (status) where.status = status;
    if (tanggalDari || tanggalSampai) {
      where.tanggalMulai = {};
      if (tanggalDari) where.tanggalMulai.gte = new Date(tanggalDari);
      if (tanggalSampai) where.tanggalMulai.lte = new Date(tanggalSampai);
    }

    const [data, total] = await Promise.all([
      this.prisma.perizinan.findMany({
        where,
        include: { santri: { select: { name: true, nis: true, kelas: true } } },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.perizinan.count({ where }),
    ]);

    return { data, meta: { total, page, limit } };
  }

  /**
   * Detail satu perizinan.
   * Requirements: 14.2
   */
  async findOne(id: string, tenantId: string) {
    return this.findOrFail(id, tenantId);
  }

  // ─── State Transitions ───────────────────────────────────────────────────────

  /**
   * DRAFT → SUBMITTED (by santri/wali)
   * Requirements: 14.1, 14.2
   */
  async submit(id: string, userId: string, tenantId: string) {
    const perizinan = await this.findOrFail(id, tenantId);
    this.assertTransition(perizinan.status, 'SUBMITTED');

    const updated = await this.prisma.perizinan.update({
      where: { id },
      data: { status: 'SUBMITTED', updatedAt: new Date() },
    });

    await this.auditLog.log({
      userId,
      aksi: 'SUBMIT_PERIZINAN',
      modul: 'perizinan',
      entitasId: id,
      entitasTipe: 'Perizinan',
      nilaiBefore: { status: perizinan.status },
      nilaiAfter: { status: 'SUBMITTED' },
    });

    return updated;
  }

  /**
   * SUBMITTED → APPROVED (by admin) + kirim WA
   * Requirements: 14.1, 14.3, 14.5
   */
  async approve(id: string, userId: string, tenantId: string) {
    const perizinan = await this.findOrFail(id, tenantId);
    this.assertTransition(perizinan.status, 'APPROVED');

    const now = new Date();
    const updated = await this.prisma.perizinan.update({
      where: { id },
      data: {
        status: 'APPROVED',
        approvedBy: userId,
        approvedAt: now,
        updatedAt: now,
      },
      include: {
        santri: { include: { walis: { include: { wali: true } } } },
      },
    });

    await this.auditLog.log({
      userId,
      aksi: 'APPROVE_PERIZINAN',
      modul: 'perizinan',
      entitasId: id,
      entitasTipe: 'Perizinan',
      nilaiBefore: { status: perizinan.status },
      nilaiAfter: { status: 'APPROVED', approvedBy: userId, approvedAt: now.toISOString() },
    });

    // Kirim notifikasi WA — Requirement 14.3
    this.notifyWali(updated, 'IZIN_APPROVED');

    return updated;
  }

  /**
   * SUBMITTED → REJECTED (by admin) + kirim WA
   * Requirements: 14.1, 14.3, 14.5
   */
  async reject(id: string, userId: string, alasan: string, tenantId: string) {
    const perizinan = await this.findOrFail(id, tenantId);
    this.assertTransition(perizinan.status, 'REJECTED');

    const now = new Date();
    const updated = await this.prisma.perizinan.update({
      where: { id },
      data: {
        status: 'REJECTED',
        approvedBy: userId,
        approvedAt: now,
        updatedAt: now,
      },
      include: {
        santri: { include: { walis: { include: { wali: true } } } },
      },
    });

    await this.auditLog.log({
      userId,
      aksi: 'REJECT_PERIZINAN',
      modul: 'perizinan',
      entitasId: id,
      entitasTipe: 'Perizinan',
      nilaiBefore: { status: perizinan.status },
      nilaiAfter: { status: 'REJECTED', rejectedBy: userId, alasan },
    });

    // Kirim notifikasi WA — Requirement 14.3
    this.notifyWali(updated, 'IZIN_REJECTED', { alasanPenolakan: alasan });

    return updated;
  }

  /**
   * APPROVED/TERLAMBAT → COMPLETED (santri kembali)
   * Requirements: 14.1, 14.4, 14.5
   */
  async complete(id: string, userId: string, tenantId: string) {
    const perizinan = await this.findOrFail(id, tenantId);
    this.assertTransition(perizinan.status, 'COMPLETED');

    const now = new Date();
    const updated = await this.prisma.perizinan.update({
      where: { id },
      data: {
        status: 'COMPLETED',
        kembaliAt: now,
        updatedAt: now,
      },
    });

    await this.auditLog.log({
      userId,
      aksi: 'COMPLETE_PERIZINAN',
      modul: 'perizinan',
      entitasId: id,
      entitasTipe: 'Perizinan',
      nilaiBefore: { status: perizinan.status },
      nilaiAfter: { status: 'COMPLETED', kembaliAt: now.toISOString() },
    });

    return updated;
  }

  /**
   * APPROVED → TERLAMBAT (digunakan oleh cron job)
   * Requirements: 14.1, 14.6
   */
  async markLate(id: string) {
    const perizinan = await this.prisma.perizinan.findUnique({ where: { id } });
    if (!perizinan) throw new NotFoundException(`Perizinan ${id} tidak ditemukan`);
    this.assertTransition(perizinan.status, 'TERLAMBAT');

    const updated = await this.prisma.perizinan.update({
      where: { id },
      data: {
        status: 'TERLAMBAT',
        terlambat: true,
        updatedAt: new Date(),
      },
      include: {
        santri: { include: { walis: { include: { wali: true } } } },
      },
    });

    await this.auditLog.log({
      aksi: 'MARK_LATE_PERIZINAN',
      modul: 'perizinan',
      entitasId: id,
      entitasTipe: 'Perizinan',
      nilaiBefore: { status: perizinan.status },
      nilaiAfter: { status: 'TERLAMBAT', terlambat: true },
    });

    return updated;
  }

  /**
   * Cari semua perizinan APPROVED yang sudah melewati tanggal selesai.
   * Digunakan oleh PerizinanLateCheckJob — Requirement 14.6
   */
  async findOverdueApproved(): Promise<{ id: string; tenantId: string; santri: any }[]> {
    const now = new Date();
    return this.prisma.perizinan.findMany({
      where: {
        status: 'APPROVED',
        tanggalSelesai: { lt: now },
      },
      include: {
        santri: { include: { walis: { include: { wali: true } } } },
      },
    });
  }
}
