import {
  BadRequestException,
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { AuditLogService } from '../audit-log/audit-log.service';
import { AuthService } from '../auth/auth.service';
import {
  CreatePegawaiDto,
  CreatePresensiPegawaiDto,
  DeactivatePegawaiDto,
  UpdatePegawaiDto,
  UpdatePresensiPegawaiDto,
} from './dto/kepegawaian.dto';

@Injectable()
export class KepegawaianService {
  private readonly logger = new Logger(KepegawaianService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly auditLog: AuditLogService,
    private readonly authService: AuthService,
  ) {}

  // ─── Pegawai CRUD ─────────────────────────────────────────────────────────

  async createPegawai(tenantId: string, dto: CreatePegawaiDto, actorId?: string) {
    // Validate linked user belongs to this tenant
    if (dto.userId) {
      const user = await this.prisma.user.findFirst({
        where: { id: dto.userId, tenantId },
      });
      if (!user) {
        throw new BadRequestException('Akun User tidak ditemukan di tenant ini');
      }
      // Ensure user is not already linked to another pegawai
      const existing = await this.prisma.pegawai.findUnique({
        where: { userId: dto.userId },
      });
      if (existing) {
        throw new ConflictException('Akun User sudah terhubung ke data pegawai lain');
      }
    }

    const pegawai = await this.prisma.pegawai.create({
      data: {
        tenantId,
        userId: dto.userId ?? null,
        nama: dto.nama,
        jabatan: dto.jabatan,
        tanggalBergabung: new Date(dto.tanggalBergabung),
        statusAktif: true,
        nip: dto.nip ?? null,
        noHp: dto.noHp ?? null,
        alamat: dto.alamat ?? null,
        dokumenUrl: dto.dokumenUrl ?? null,
      },
      include: { user: { select: { id: true, email: true, name: true, role: true } } },
    });

    await this.auditLog.log({
      aksi: 'CREATE_PEGAWAI',
      modul: 'kepegawaian',
      userId: actorId,
      entitasId: pegawai.id,
      entitasTipe: 'Pegawai',
      nilaiAfter: { nama: pegawai.nama, jabatan: pegawai.jabatan },
    });

    return pegawai;
  }

  async findAllPegawai(tenantId: string, includeInactive = false) {
    return this.prisma.pegawai.findMany({
      where: {
        tenantId,
        deletedAt: null,
        ...(includeInactive ? {} : { statusAktif: true }),
      },
      include: { user: { select: { id: true, email: true, name: true, role: true } } },
      orderBy: { nama: 'asc' },
    });
  }

  async findOnePegawai(tenantId: string, id: string) {
    const pegawai = await this.prisma.pegawai.findFirst({
      where: { id, tenantId, deletedAt: null },
      include: { user: { select: { id: true, email: true, name: true, role: true } } },
    });
    if (!pegawai) throw new NotFoundException('Data pegawai tidak ditemukan');
    return pegawai;
  }

  async updatePegawai(tenantId: string, id: string, dto: UpdatePegawaiDto, actorId?: string) {
    const pegawai = await this.findOnePegawai(tenantId, id);

    const updated = await this.prisma.pegawai.update({
      where: { id },
      data: {
        ...(dto.nama !== undefined && { nama: dto.nama }),
        ...(dto.jabatan !== undefined && { jabatan: dto.jabatan }),
        ...(dto.tanggalBergabung !== undefined && { tanggalBergabung: new Date(dto.tanggalBergabung) }),
        ...(dto.nip !== undefined && { nip: dto.nip }),
        ...(dto.noHp !== undefined && { noHp: dto.noHp }),
        ...(dto.alamat !== undefined && { alamat: dto.alamat }),
        ...(dto.dokumenUrl !== undefined && { dokumenUrl: dto.dokumenUrl }),
      },
      include: { user: { select: { id: true, email: true, name: true, role: true } } },
    });

    await this.auditLog.log({
      aksi: 'UPDATE_PEGAWAI',
      modul: 'kepegawaian',
      userId: actorId,
      entitasId: id,
      entitasTipe: 'Pegawai',
      nilaiBefore: { nama: pegawai.nama, jabatan: pegawai.jabatan },
      nilaiAfter: { nama: updated.nama, jabatan: updated.jabatan },
    });

    return updated;
  }

  /**
   * Deactivate an employee and simultaneously revoke ALL active refresh tokens
   * for the associated user account — Requirement 16.2
   */
  async deactivatePegawai(
    tenantId: string,
    id: string,
    dto: DeactivatePegawaiDto,
    actorId?: string,
  ) {
    const pegawai = await this.findOnePegawai(tenantId, id);

    if (!pegawai.statusAktif) {
      throw new BadRequestException('Pegawai sudah dalam status tidak aktif');
    }

    // Deactivate pegawai and revoke user sessions simultaneously — Requirement 16.2
    await this.prisma.$transaction(async (tx) => {
      // 1. Set statusAktif = false
      await tx.pegawai.update({
        where: { id },
        data: { statusAktif: false },
      });

      // 2. If linked user exists, deactivate user account too
      if (pegawai.userId) {
        await tx.user.update({
          where: { id: pegawai.userId },
          data: { isActive: false },
        });
      }
    });

    // 3. Revoke ALL active refresh tokens for the linked user (outside transaction for atomicity)
    if (pegawai.userId) {
      await this.authService.revokeUserSessions(pegawai.userId);
      this.logger.log(
        `Revoked all sessions for user ${pegawai.userId} due to employee deactivation (pegawai: ${id})`,
      );
    }

    await this.auditLog.log({
      aksi: 'DEACTIVATE_PEGAWAI',
      modul: 'kepegawaian',
      userId: actorId,
      entitasId: id,
      entitasTipe: 'Pegawai',
      nilaiBefore: { statusAktif: true },
      nilaiAfter: { statusAktif: false, alasan: dto.alasan },
    });

    return { success: true, message: 'Pegawai berhasil dinonaktifkan dan akses login dicabut' };
  }

  /**
   * Soft-delete a pegawai record — Requirement 16.1
   */
  async deletePegawai(tenantId: string, id: string, actorId?: string) {
    const pegawai = await this.findOnePegawai(tenantId, id);

    await this.prisma.pegawai.update({
      where: { id },
      data: { deletedAt: new Date() },
    });

    await this.auditLog.log({
      aksi: 'DELETE_PEGAWAI',
      modul: 'kepegawaian',
      userId: actorId,
      entitasId: id,
      entitasTipe: 'Pegawai',
      nilaiBefore: { nama: pegawai.nama },
    });

    return { success: true };
  }

  // ─── Presensi Pegawai ─────────────────────────────────────────────────────
  // Requirement 16.3: separate from santri attendance

  async createPresensi(tenantId: string, dto: CreatePresensiPegawaiDto, actorId?: string) {
    // Verify pegawai belongs to this tenant
    const pegawai = await this.prisma.pegawai.findFirst({
      where: { id: dto.pegawaiId, tenantId, deletedAt: null },
    });
    if (!pegawai) throw new NotFoundException('Data pegawai tidak ditemukan');

    const tanggal = new Date(dto.tanggal);

    // Check for duplicate (one record per employee per day)
    const existing = await this.prisma.presensiPegawai.findUnique({
      where: { pegawaiId_tanggal: { pegawaiId: dto.pegawaiId, tanggal } },
    });
    if (existing) {
      throw new ConflictException('Presensi pegawai untuk tanggal ini sudah dicatat');
    }

    const presensi = await this.prisma.presensiPegawai.create({
      data: {
        tenantId,
        pegawaiId: dto.pegawaiId,
        tanggal,
        status: dto.status,
        jamMasuk: dto.jamMasuk ? new Date(dto.jamMasuk) : null,
        jamKeluar: dto.jamKeluar ? new Date(dto.jamKeluar) : null,
        keterangan: dto.keterangan ?? null,
        dicatatOleh: actorId ?? null,
      },
    });

    await this.auditLog.log({
      aksi: 'CREATE_PRESENSI_PEGAWAI',
      modul: 'kepegawaian',
      userId: actorId,
      entitasId: presensi.id,
      entitasTipe: 'PresensiPegawai',
      nilaiAfter: { pegawaiId: dto.pegawaiId, tanggal: dto.tanggal, status: dto.status },
    });

    return presensi;
  }

  async findPresensiByPegawai(
    tenantId: string,
    pegawaiId: string,
    bulan?: number,
    tahun?: number,
  ) {
    // Verify pegawai belongs to tenant
    await this.findOnePegawai(tenantId, pegawaiId);

    const where: any = { pegawaiId, tenantId };

    if (bulan && tahun) {
      const startDate = new Date(tahun, bulan - 1, 1);
      const endDate = new Date(tahun, bulan, 0); // last day of month
      where.tanggal = { gte: startDate, lte: endDate };
    }

    return this.prisma.presensiPegawai.findMany({
      where,
      orderBy: { tanggal: 'desc' },
    });
  }

  async updatePresensi(
    tenantId: string,
    presensiId: string,
    dto: UpdatePresensiPegawaiDto,
    actorId?: string,
  ) {
    const presensi = await this.prisma.presensiPegawai.findFirst({
      where: { id: presensiId, tenantId },
    });
    if (!presensi) throw new NotFoundException('Data presensi tidak ditemukan');

    const updated = await this.prisma.presensiPegawai.update({
      where: { id: presensiId },
      data: {
        ...(dto.status !== undefined && { status: dto.status }),
        ...(dto.jamMasuk !== undefined && { jamMasuk: new Date(dto.jamMasuk) }),
        ...(dto.jamKeluar !== undefined && { jamKeluar: new Date(dto.jamKeluar) }),
        ...(dto.keterangan !== undefined && { keterangan: dto.keterangan }),
      },
    });

    await this.auditLog.log({
      aksi: 'UPDATE_PRESENSI_PEGAWAI',
      modul: 'kepegawaian',
      userId: actorId,
      entitasId: presensiId,
      entitasTipe: 'PresensiPegawai',
      nilaiBefore: { status: presensi.status },
      nilaiAfter: { status: updated.status },
    });

    return updated;
  }

  async getRekapPresensi(tenantId: string, bulan: number, tahun: number) {
    const startDate = new Date(tahun, bulan - 1, 1);
    const endDate = new Date(tahun, bulan, 0);

    return this.prisma.presensiPegawai.findMany({
      where: {
        tenantId,
        tanggal: { gte: startDate, lte: endDate },
      },
      include: {
        pegawai: { select: { id: true, nama: true, jabatan: true } },
      },
      orderBy: [{ tanggal: 'asc' }, { pegawai: { nama: 'asc' } }],
    });
  }
}
