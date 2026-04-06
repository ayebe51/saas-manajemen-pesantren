import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { AuditLogService } from '../audit-log/audit-log.service';
import { WaQueueService } from '../wa-engine/wa-queue.service';
import {
  CreateKunjunganDto,
  CreateKunjunganTamuDto,
  CheckoutKunjunganTamuDto,
  QueryKunjunganTamuDto,
} from './dto/kunjungan.dto';

@Injectable()
export class KunjunganService {
  private readonly logger = new Logger(KunjunganService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly auditLog: AuditLogService,
    private readonly waQueue: WaQueueService,
  ) {}

  // ─── Existing Visit Scheduling ────────────────────────────────────────────

  async create(tenantId: string, dto: CreateKunjunganDto) {
    const santri = await this.prisma.santri.findFirst({
      where: { id: dto.santriId, tenantId },
    });

    if (!santri) {
      throw new NotFoundException('Santri not found');
    }

    const targetDate = new Date(dto.scheduledAt);
    targetDate.setHours(0, 0, 0, 0);
    const nextDay = new Date(targetDate);
    nextDay.setDate(nextDay.getDate() + 1);

    const existingVisits = await this.prisma.kunjungan.count({
      where: {
        tenantId,
        slot: dto.slot,
        scheduledAt: { gte: targetDate, lt: nextDay },
        status: { not: 'CANCELLED' },
      },
    });

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
      whereClause.scheduledAt = { gte: targetDate, lt: nextDay };
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
        scheduledAt: { gte: targetDate, lt: nextDay },
        status: { not: 'CANCELLED' },
      },
      _count: { id: true },
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

    if (!visit) throw new NotFoundException('Visit not found');

    if (visit.status === 'CANCELLED' || visit.status === 'COMPLETED') {
      throw new BadRequestException(`Cannot check in. Status is ${visit.status}`);
    }

    if (visit.tamu.length >= visit.visitorLimit) {
      throw new BadRequestException('Visitor limit reached for this booking');
    }

    return this.prisma.$transaction(async (prisma) => {
      await prisma.tamu.create({
        data: {
          kunjunganId: id,
          name: visitorName || 'Wali Santri',
          checkinAt: new Date(),
        },
      });

      return prisma.kunjungan.update({
        where: { id },
        data: { status: 'CHECKED_IN' },
        include: { tamu: true },
      });
    });
  }

  // ─── KunjunganTamu (Guest Visit Recording) ────────────────────────────────
  // Requirements: 10.1, 10.2

  /**
   * Catat kunjungan tamu baru dan kirim notifikasi WA ke Wali_Santri.
   * Requirements: 10.1, 10.2
   */
  async createKunjunganTamu(
    tenantId: string,
    dto: CreateKunjunganTamuDto,
    userId: string,
  ) {
    const santri = await this.prisma.santri.findFirst({
      where: { id: dto.santriId, tenantId, deletedAt: null },
      include: {
        walis: { include: { wali: true } },
      },
    });

    if (!santri) throw new NotFoundException('Santri tidak ditemukan');

    const kunjungan = await this.prisma.kunjunganTamu.create({
      data: {
        tenantId,
        santriId: dto.santriId,
        namaTamu: dto.namaTamu,
        hubungan: dto.hubungan,
        waktuMasuk: dto.waktuMasuk ? new Date(dto.waktuMasuk) : new Date(), // server timestamp
        keterangan: dto.keterangan ?? null,
        createdBy: userId,
      },
      include: {
        santri: { select: { name: true, nis: true, kelas: true } },
      },
    });

    await this.auditLog.log({
      userId,
      aksi: 'CREATE_KUNJUNGAN_TAMU',
      modul: 'kunjungan',
      entitasId: kunjungan.id,
      entitasTipe: 'KunjunganTamu',
      nilaiAfter: {
        santriId: dto.santriId,
        namaTamu: dto.namaTamu,
        hubungan: dto.hubungan,
        waktuMasuk: kunjungan.waktuMasuk.toISOString(),
      },
    });

    // Kirim notifikasi WA ke semua wali santri — Requirement 10.2
    this.notifyWali(santri, kunjungan);

    return kunjungan;
  }

  /**
   * Daftar kunjungan tamu dengan filter.
   * Requirements: 10.1
   */
  async findAllKunjunganTamu(tenantId: string, query: QueryKunjunganTamuDto) {
    const where: any = { tenantId };

    if (query.santriId) where.santriId = query.santriId;

    if (query.tanggalDari || query.tanggalSampai) {
      where.waktuMasuk = {};
      if (query.tanggalDari) where.waktuMasuk.gte = new Date(query.tanggalDari);
      if (query.tanggalSampai) {
        const end = new Date(query.tanggalSampai);
        end.setHours(23, 59, 59, 999);
        where.waktuMasuk.lte = end;
      }
    }

    return this.prisma.kunjunganTamu.findMany({
      where,
      include: {
        santri: { select: { name: true, nis: true, kelas: true } },
      },
      orderBy: { waktuMasuk: 'desc' },
    });
  }

  /**
   * Detail satu kunjungan tamu.
   */
  async findOneKunjunganTamu(id: string, tenantId: string) {
    const kunjungan = await this.prisma.kunjunganTamu.findFirst({
      where: { id, tenantId },
      include: {
        santri: { select: { name: true, nis: true, kelas: true } },
      },
    });

    if (!kunjungan) throw new NotFoundException(`Kunjungan tamu ${id} tidak ditemukan`);
    return kunjungan;
  }

  /**
   * Catat waktu keluar tamu (checkout).
   * Requirements: 10.1
   */
  async checkoutKunjunganTamu(
    id: string,
    tenantId: string,
    dto: CheckoutKunjunganTamuDto,
    userId: string,
  ) {
    const kunjungan = await this.prisma.kunjunganTamu.findFirst({
      where: { id, tenantId },
    });

    if (!kunjungan) throw new NotFoundException(`Kunjungan tamu ${id} tidak ditemukan`);

    if (kunjungan.waktuKeluar) {
      throw new BadRequestException('Tamu sudah tercatat keluar');
    }

    const waktuKeluar = dto.waktuKeluar ? new Date(dto.waktuKeluar) : new Date();

    const updated = await this.prisma.kunjunganTamu.update({
      where: { id },
      data: { waktuKeluar },
      include: {
        santri: { select: { name: true, nis: true } },
      },
    });

    await this.auditLog.log({
      userId,
      aksi: 'CHECKOUT_KUNJUNGAN_TAMU',
      modul: 'kunjungan',
      entitasId: id,
      entitasTipe: 'KunjunganTamu',
      nilaiBefore: { waktuKeluar: null },
      nilaiAfter: { waktuKeluar: waktuKeluar.toISOString() },
    });

    return updated;
  }

  // ─── Private Helpers ──────────────────────────────────────────────────────

  /** Kirim notifikasi WA ke semua wali santri saat kunjungan dicatat */
  private notifyWali(santri: any, kunjungan: any): void {
    const walis: any[] = santri.walis ?? [];
    for (const sw of walis) {
      const phone = sw.wali?.noHp ?? sw.wali?.phone;
      if (!phone) continue;

      this.waQueue.enqueue({
        tipeNotifikasi: 'kunjungan',
        noTujuan: phone,
        templateKey: 'KUNJUNGAN_TAMU',
        payload: {
          namaSantri: santri.name ?? '',
          namaTamu: kunjungan.namaTamu,
          hubungan: kunjungan.hubungan,
          waktuMasuk: kunjungan.waktuMasuk.toISOString(),
        },
      });
    }
  }
}
