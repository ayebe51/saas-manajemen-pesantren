import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { WaQueueService } from '../wa-engine/wa-queue.service';
import { AuditLogService } from '../audit-log/audit-log.service';
import {
  CreatePelanggaranDto,
  CreateRewardPoinDto,
  CreateKategoriPelanggaranDto,
  CreatePembinaanDto,
  QueryPelanggaranDto,
} from './dto/pelanggaran.dto';
import { TingkatKeparahan } from '@prisma/client';

// Ambang batas poin pelanggaran yang memicu tindakan otomatis
const THRESHOLD_PERINGATAN = 30;  // Peringatan pertama
const THRESHOLD_PEMBINAAN = 60;   // Wajib pembinaan
const THRESHOLD_KRITIS = 100;     // Tindakan kritis

@Injectable()
export class PelanggaranService {
  private readonly logger = new Logger(PelanggaranService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly waQueue: WaQueueService,
    private readonly auditLog: AuditLogService,
  ) {}

  // ─── Kategori Pelanggaran ─────────────────────────────────────────────────

  async createKategori(dto: CreateKategoriPelanggaranDto) {
    return this.prisma.kategoriPelanggaran.create({
      data: {
        nama: dto.nama,
        deskripsi: dto.deskripsi,
        tingkatKeparahan: dto.tingkatKeparahan as TingkatKeparahan,
        poinDefault: dto.poinDefault ?? 0,
      },
    });
  }

  async findAllKategori() {
    return this.prisma.kategoriPelanggaran.findMany({
      where: { isActive: true },
      orderBy: { nama: 'asc' },
    });
  }

  // ─── Pelanggaran ──────────────────────────────────────────────────────────

  /**
   * Catat pelanggaran santri.
   * - Hitung akumulasi poin
   * - Trigger tindakan otomatis jika ambang batas tercapai
   * - Kirim notifikasi WA ke Wali_Santri
   * - Catat ke audit log
   * Requirements: 8.1, 8.2, 8.3, 8.6
   */
  async createPelanggaran(
    tenantId: string,
    dto: CreatePelanggaranDto,
    createdBy: string,
  ) {
    const santri = await this.prisma.santri.findFirst({
      where: { id: dto.santriId, tenantId, deletedAt: null },
      include: {
        walis: {
          where: { isPrimary: true },
          include: { wali: true },
          take: 1,
        },
      },
    });

    if (!santri) throw new NotFoundException('Santri tidak ditemukan');

    const severityMap: Record<string, number> = { RINGAN: 1, SEDANG: 2, BERAT: 3 };

    // Buat record pelanggaran dengan server_timestamp — Requirement 8.1
    const pelanggaran = await this.prisma.pelanggaran.create({
      data: {
        tenantId,
        santriId: dto.santriId,
        kategoriId: dto.kategoriId ?? null,
        recordedBy: createdBy,
        category: dto.category,
        tingkatKeparahan: dto.tingkatKeparahan as TingkatKeparahan,
        severity: severityMap[dto.tingkatKeparahan] ?? 1,
        poin: dto.poin,
        points: dto.poin,
        keterangan: dto.keterangan,
        description: dto.description ?? dto.keterangan ?? '',
        serverTimestamp: new Date(),
        createdBy,
      },
      include: {
        kategori: true,
        santri: { select: { name: true, namaLengkap: true, kelas: true } },
      },
    });

    // Hitung akumulasi poin pelanggaran — Requirement 8.2
    const totalPoin = await this.hitungAkumulasiPoin(dto.santriId);

    // Trigger tindakan otomatis berdasarkan ambang batas — Requirement 8.2
    await this.checkThreshold(tenantId, dto.santriId, totalPoin, createdBy);

    // Kirim notifikasi WA ke Wali_Santri — Requirement 8.3
    const wali = santri.walis[0]?.wali;
    const waliHp = wali?.noHp ?? wali?.phone;
    if (waliHp) {
      this.waQueue.enqueue({
        tipeNotifikasi: 'pelanggaran',
        noTujuan: waliHp,
        templateKey: 'PELANGGARAN',
        payload: {
          wali_nama: wali?.namaLengkap ?? wali?.name ?? 'Wali',
          santri_nama: santri.namaLengkap ?? santri.name,
          pelanggaran_nama: dto.category,
          tanggal: new Date().toLocaleDateString('id-ID'),
          total_poin: totalPoin,
          keterangan: dto.keterangan ?? '-',
        },
      });
    }

    // Catat ke audit log — Requirement 8.6
    await this.auditLog.log({
      userId: createdBy,
      aksi: 'CREATE_PELANGGARAN',
      modul: 'pelanggaran',
      entitasId: pelanggaran.id,
      entitasTipe: 'Pelanggaran',
      nilaiAfter: {
        santriId: dto.santriId,
        kategoriId: dto.kategoriId,
        tingkatKeparahan: dto.tingkatKeparahan,
        poin: dto.poin,
        totalPoinAkumulasi: totalPoin,
      },
    });

    return { ...pelanggaran, totalPoinAkumulasi: totalPoin };
  }

  async findAllPelanggaran(tenantId: string, query: QueryPelanggaranDto = {}) {
    const where: Record<string, unknown> = { tenantId };
    if (query.santriId) where.santriId = query.santriId;
    if (query.tingkatKeparahan) where.tingkatKeparahan = query.tingkatKeparahan;

    return this.prisma.pelanggaran.findMany({
      where,
      include: {
        santri: { select: { name: true, namaLengkap: true, kelas: true } },
        kategori: true,
      },
      orderBy: { serverTimestamp: 'desc' },
    });
  }

  /**
   * Hitung akumulasi poin pelanggaran per santri.
   * Requirements: 8.2
   */
  async hitungAkumulasiPoin(santriId: string): Promise<number> {
    const result = await this.prisma.pelanggaran.aggregate({
      where: { santriId, resolved: false },
      _sum: { poin: true },
    });
    return result._sum.poin ?? 0;
  }

  async getSummaryPelanggaran(tenantId: string, santriId: string) {
    const [pelanggaran, totalPoin] = await Promise.all([
      this.prisma.pelanggaran.findMany({
        where: { tenantId, santriId },
        orderBy: { serverTimestamp: 'desc' },
        include: { kategori: true },
      }),
      this.hitungAkumulasiPoin(santriId),
    ]);

    return {
      pelanggaran,
      totalPoin,
      status: this.getStatusFromPoin(totalPoin),
    };
  }

  // ─── Reward Poin ──────────────────────────────────────────────────────────

  /**
   * Catat poin reward untuk santri.
   * - Kirim notifikasi WA ke Wali_Santri
   * - Catat ke audit log
   * Requirements: 8.4, 8.5, 8.6
   */
  async createReward(
    tenantId: string,
    dto: CreateRewardPoinDto,
    createdBy: string,
  ) {
    const santri = await this.prisma.santri.findFirst({
      where: { id: dto.santriId, tenantId, deletedAt: null },
      include: {
        walis: {
          where: { isPrimary: true },
          include: { wali: true },
          take: 1,
        },
      },
    });

    if (!santri) throw new NotFoundException('Santri tidak ditemukan');

    const reward = await this.prisma.rewardPoin.create({
      data: {
        santriId: dto.santriId,
        poin: dto.poin,
        keterangan: dto.keterangan,
        serverTimestamp: new Date(),
        createdBy,
      },
    });

    // Kirim notifikasi WA ke Wali_Santri — Requirement 8.5
    const wali = santri.walis[0]?.wali;
    const waliHp = wali?.noHp ?? wali?.phone;
    if (waliHp) {
      this.waQueue.enqueue({
        tipeNotifikasi: 'reward',
        noTujuan: waliHp,
        templateKey: 'REWARD_POIN',
        payload: {
          wali_nama: wali?.namaLengkap ?? wali?.name ?? 'Wali',
          santri_nama: santri.namaLengkap ?? santri.name,
          poin: dto.poin,
          keterangan: dto.keterangan,
          tanggal: new Date().toLocaleDateString('id-ID'),
        },
      });
    }

    // Catat ke audit log — Requirement 8.6
    await this.auditLog.log({
      userId: createdBy,
      aksi: 'CREATE_REWARD_POIN',
      modul: 'pelanggaran',
      entitasId: reward.id,
      entitasTipe: 'RewardPoin',
      nilaiAfter: {
        santriId: dto.santriId,
        poin: dto.poin,
        keterangan: dto.keterangan,
      },
    });

    return reward;
  }

  async findAllReward(tenantId: string, santriId?: string) {
    const where: Record<string, unknown> = {};
    if (santriId) {
      where.santriId = santriId;
    } else {
      // Filter by tenant via santri relation
      where.santri = { tenantId };
    }

    return this.prisma.rewardPoin.findMany({
      where,
      include: {
        santri: { select: { name: true, namaLengkap: true, kelas: true } },
      },
      orderBy: { serverTimestamp: 'desc' },
    });
  }

  // ─── Pembinaan ────────────────────────────────────────────────────────────

  async createPembinaan(tenantId: string, dto: CreatePembinaanDto) {
    const santri = await this.prisma.santri.findFirst({
      where: { id: dto.santriId, tenantId },
    });
    if (!santri) throw new NotFoundException('Santri tidak ditemukan');

    return this.prisma.pembinaan.create({
      data: {
        tenantId,
        santriId: dto.santriId,
        plan: dto.plan,
        targetDate: new Date(dto.targetDate),
        assignedTo: dto.assignedTo,
        status: 'ONGOING',
      },
    });
  }

  async findAllPembinaan(tenantId: string, santriId?: string) {
    const where: Record<string, unknown> = { tenantId };
    if (santriId) where.santriId = santriId;

    return this.prisma.pembinaan.findMany({
      where,
      include: { santri: { select: { name: true } } },
      orderBy: { targetDate: 'asc' },
    });
  }

  // ─── Private helpers ──────────────────────────────────────────────────────

  /**
   * Cek ambang batas poin dan trigger tindakan otomatis.
   * Requirements: 8.2
   */
  private async checkThreshold(
    _tenantId: string,
    santriId: string,
    totalPoin: number,
    triggeredBy: string,
  ): Promise<void> {
    if (totalPoin >= THRESHOLD_KRITIS) {
      this.logger.warn(
        `[Pelanggaran] Santri ${santriId} mencapai ambang KRITIS (${totalPoin} poin)`,
      );
      await this.auditLog.log({
        userId: triggeredBy,
        aksi: 'THRESHOLD_KRITIS_TERCAPAI',
        modul: 'pelanggaran',
        entitasId: santriId,
        entitasTipe: 'Santri',
        metadata: { totalPoin, threshold: THRESHOLD_KRITIS },
      });
    } else if (totalPoin >= THRESHOLD_PEMBINAAN) {
      this.logger.warn(
        `[Pelanggaran] Santri ${santriId} mencapai ambang PEMBINAAN (${totalPoin} poin)`,
      );
      await this.auditLog.log({
        userId: triggeredBy,
        aksi: 'THRESHOLD_PEMBINAAN_TERCAPAI',
        modul: 'pelanggaran',
        entitasId: santriId,
        entitasTipe: 'Santri',
        metadata: { totalPoin, threshold: THRESHOLD_PEMBINAAN },
      });
    } else if (totalPoin >= THRESHOLD_PERINGATAN) {
      this.logger.log(
        `[Pelanggaran] Santri ${santriId} mencapai ambang PERINGATAN (${totalPoin} poin)`,
      );
    }
  }

  private getStatusFromPoin(totalPoin: number): string {
    if (totalPoin >= THRESHOLD_KRITIS) return 'KRITIS';
    if (totalPoin >= THRESHOLD_PEMBINAAN) return 'PERLU_PEMBINAAN';
    if (totalPoin >= THRESHOLD_PERINGATAN) return 'PERINGATAN';
    return 'NORMAL';
  }
}
