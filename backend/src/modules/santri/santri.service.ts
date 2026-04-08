import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
  ForbiddenException,
} from '@nestjs/common';
import { Workbook, Row } from 'exceljs';
import { PrismaService } from '../../common/prisma/prisma.service';
import { AuditLogService } from '../audit-log/audit-log.service';
import {
  CreateSantriDto,
  UpdateSantriDto,
  CreateWaliDto,
  SantriFilterDto,
} from './dto/santri.dto';

@Injectable()
export class SantriService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditLog: AuditLogService,
  ) {}

  // ─── Helpers ────────────────────────────────────────────────────────────────

  private async assertNisUnique(nis: string, excludeId?: string): Promise<void> {
    const existing = await this.prisma.santri.findFirst({
      where: {
        nis,
        deletedAt: null,
        ...(excludeId ? { NOT: { id: excludeId } } : {}),
      },
    });
    if (existing) {
      throw new ConflictException(`NIS '${nis}' sudah digunakan oleh santri lain`);
    }
  }

  private async assertExists(id: string, tenantId: string) {
    const santri = await this.prisma.santri.findFirst({
      where: { id, tenantId, deletedAt: null },
      include: {
        walis: { include: { wali: true } },
        _count: { select: { izin: true, pelanggaran: true, invoices: true } },
      },
    });
    if (!santri) {
      throw new NotFoundException(`Santri dengan ID ${id} tidak ditemukan`);
    }
    return santri;
  }

  // ─── CRUD ────────────────────────────────────────────────────────────────────

  async create(
    tenantId: string,
    dto: CreateSantriDto,
    userId?: string,
    ipAddress?: string,
  ) {
    if (dto.nis) {
      await this.assertNisUnique(dto.nis);
    }

    const santri = await this.prisma.santri.create({
      data: {
        tenantId,
        nis: dto.nis ?? null,
        nisn: dto.nisn ?? null,
        nik: (dto as any).nik ?? null,
        namaLengkap: dto.namaLengkap ?? dto.name,
        namaPanggilan: dto.namaPanggilan ?? null,
        name: dto.name,
        gender: dto.gender,
        jenisKelamin: dto.jenisKelamin ?? dto.gender,
        dob: dto.dob ? new Date(dto.dob) : null,
        tanggalLahir: dto.tanggalLahir ? new Date(dto.tanggalLahir) : null,
        tempatLahir: dto.tempatLahir ?? null,
        kelas: dto.kelas ?? null,
        room: dto.room ?? null,
        noHp: dto.noHp ?? dto.contact ?? null,
        contact: dto.contact ?? dto.noHp ?? null,
        address: dto.address ?? dto.alamat ?? null,
        alamat: dto.alamat ?? dto.address ?? null,
        provinsi: (dto as any).provinsi ?? null,
        kabupaten: (dto as any).kabupaten ?? null,
        kecamatan: (dto as any).kecamatan ?? null,
        kelurahan: (dto as any).kelurahan ?? null,
        namaAyah: (dto as any).namaAyah ?? null,
        namaIbu: (dto as any).namaIbu ?? null,
        fotoUrl: dto.fotoUrl ?? dto.photo ?? null,
        photo: dto.photo ?? dto.fotoUrl ?? null,
        tanggalMasuk: dto.tanggalMasuk ? new Date(dto.tanggalMasuk) : null,
        status: dto.status ?? 'AKTIF',
      },
    });

    await this.auditLog.log({
      userId,
      aksi: 'CREATE_SANTRI',
      modul: 'santri',
      entitasId: santri.id,
      entitasTipe: 'Santri',
      nilaiAfter: { id: santri.id, nis: santri.nis, name: santri.name, status: santri.status },
      ipAddress,
    });

    return santri;
  }

  async findAll(tenantId: string, filters: SantriFilterDto, requestingUser?: { id: string; role: string }) {
    const page = filters.page ?? 1;
    const limit = filters.limit ?? 10;
    const skip = (page - 1) * limit;

    const where: any = { tenantId, deletedAt: null };

    if (filters.status) where.status = filters.status;
    if (filters.kelas) where.kelas = filters.kelas;
    if (filters.room) where.room = filters.room;

    if (filters.waliId) {
      where.walis = { some: { wali: { userId: filters.waliId } } };
    }

    // Req 2.7 — Wali_Santri hanya melihat santri tanggungannya
    if (requestingUser?.role === 'Wali_Santri') {
      where.walis = { some: { wali: { userId: requestingUser.id } } };
    }

    if (filters.search) {
      where.OR = [
        { name: { contains: filters.search, mode: 'insensitive' } },
        { namaLengkap: { contains: filters.search, mode: 'insensitive' } },
        { nis: { contains: filters.search, mode: 'insensitive' } },
        { nisn: { contains: filters.search, mode: 'insensitive' } },
        { kelas: { contains: filters.search, mode: 'insensitive' } },
      ];
    }

    const [items, total] = await Promise.all([
      this.prisma.santri.findMany({
        where,
        include: { walis: { include: { wali: true } } },
        orderBy: { name: 'asc' },
        skip,
        take: limit,
      }),
      this.prisma.santri.count({ where }),
    ]);

    return {
      data: items,
      meta: { total, page, lastPage: Math.ceil(total / limit) },
    };
  }

  async findOne(id: string, tenantId: string, requestingUser?: { id: string; role: string }) {
    const santri = await this.assertExists(id, tenantId);

    // Req 2.7 — Wali_Santri hanya boleh mengakses santri tanggungannya
    if (requestingUser?.role === 'Wali_Santri') {
      const link = await this.prisma.santriWali.findFirst({
        where: {
          santriId: id,
          wali: { userId: requestingUser.id },
        },
      });
      if (!link) {
        throw new ForbiddenException('Anda tidak memiliki akses ke data santri ini');
      }
    }

    return santri;
  }

  async update(
    id: string,
    tenantId: string,
    dto: UpdateSantriDto,
    userId?: string,
    ipAddress?: string,
  ) {
    const before = await this.assertExists(id, tenantId);

    if (dto.nis && dto.nis !== before.nis) {
      await this.assertNisUnique(dto.nis, id);
    }

    const updated = await this.prisma.santri.update({
      where: { id },
      data: {
        ...(dto.nis !== undefined && { nis: dto.nis }),
        ...(dto.name !== undefined && { name: dto.name, namaLengkap: dto.name }),
        ...(dto.namaLengkap !== undefined && { namaLengkap: dto.namaLengkap, name: dto.namaLengkap }),
        ...(dto.namaPanggilan !== undefined && { namaPanggilan: dto.namaPanggilan }),
        ...(dto.kelas !== undefined && { kelas: dto.kelas }),
        ...(dto.room !== undefined && { room: dto.room }),
        ...(dto.status !== undefined && { status: dto.status }),
        ...(dto.contact !== undefined && { contact: dto.contact, noHp: dto.contact }),
        ...(dto.noHp !== undefined && { noHp: dto.noHp, contact: dto.noHp }),
        ...(dto.address !== undefined && { address: dto.address, alamat: dto.address }),
        ...(dto.alamat !== undefined && { alamat: dto.alamat, address: dto.alamat }),
        ...((dto as any).provinsi !== undefined && { provinsi: (dto as any).provinsi }),
        ...((dto as any).kabupaten !== undefined && { kabupaten: (dto as any).kabupaten }),
        ...((dto as any).kecamatan !== undefined && { kecamatan: (dto as any).kecamatan }),
        ...((dto as any).kelurahan !== undefined && { kelurahan: (dto as any).kelurahan }),
        ...((dto as any).namaAyah !== undefined && { namaAyah: (dto as any).namaAyah }),
        ...((dto as any).namaIbu !== undefined && { namaIbu: (dto as any).namaIbu }),
        ...((dto as any).nik !== undefined && { nik: (dto as any).nik }),
        ...(dto.fotoUrl !== undefined && { fotoUrl: dto.fotoUrl, photo: dto.fotoUrl }),
        ...(dto.photo !== undefined && { photo: dto.photo, fotoUrl: dto.photo }),
        ...(dto.tanggalMasuk !== undefined && { tanggalMasuk: new Date(dto.tanggalMasuk) }),
        ...(dto.tanggalKeluar !== undefined && { tanggalKeluar: new Date(dto.tanggalKeluar) }),
      },
    });

    await this.auditLog.log({
      userId,
      aksi: 'UPDATE_SANTRI',
      modul: 'santri',
      entitasId: id,
      entitasTipe: 'Santri',
      nilaiBefore: { nis: before.nis, name: before.name, status: before.status, kelas: before.kelas },
      nilaiAfter: { nis: updated.nis, name: updated.name, status: updated.status, kelas: updated.kelas },
      ipAddress,
    });

    return updated;
  }

  /** Soft delete — sets deletedAt, preserves all historical data. Req 3.3 */
  async remove(
    id: string,
    tenantId: string,
    userId?: string,
    ipAddress?: string,
  ) {
    const before = await this.assertExists(id, tenantId);

    await this.prisma.santri.update({
      where: { id },
      data: { deletedAt: new Date() },
    });

    await this.auditLog.log({
      userId,
      aksi: 'DELETE_SANTRI',
      modul: 'santri',
      entitasId: id,
      entitasTipe: 'Santri',
      nilaiBefore: { nis: before.nis, name: before.name, status: before.status },
      nilaiAfter: { deletedAt: new Date().toISOString() },
      ipAddress,
    });

    return { message: 'Santri berhasil dihapus (soft delete)' };
  }

  /** Riwayat perubahan santri dari audit log. Req 3.5 */
  async getHistory(id: string, tenantId: string) {
    // Verify santri exists (including soft-deleted for history access)
    const santri = await this.prisma.santri.findFirst({
      where: { id, tenantId },
    });
    if (!santri) {
      throw new NotFoundException(`Santri dengan ID ${id} tidak ditemukan`);
    }

    return this.prisma.auditLog.findMany({
      where: { entityId: id, entity: 'santri' },
      orderBy: { serverTimestamp: 'desc' },
      include: { user: { select: { name: true, role: true } } },
    });
  }

  // ─── Wali Management ─────────────────────────────────────────────────────────

  async addWali(
    santriId: string,
    tenantId: string,
    dto: CreateWaliDto,
    userId?: string,
    ipAddress?: string,
  ) {
    await this.assertExists(santriId, tenantId);

    const existingCount = await this.prisma.santriWali.count({ where: { santriId } });
    const isPrimary = existingCount === 0;

    const result = await this.prisma.$transaction(async (tx) => {
      const wali = await tx.wali.create({
        data: {
          tenantId,
          name: dto.name,
          namaLengkap: dto.namaLengkap ?? dto.name,
          relation: dto.relation ?? dto.hubungan ?? '',
          hubungan: dto.hubungan ?? dto.relation ?? '',
          phone: dto.phone ?? dto.noHp ?? '',
          noHp: dto.noHp ?? dto.phone ?? '',
          email: dto.email ?? null,
          address: dto.address ?? dto.alamat ?? null,
          alamat: dto.alamat ?? dto.address ?? null,
        },
      });

      await tx.santriWali.create({
        data: { santriId, waliId: wali.id, isPrimary },
      });

      return wali;
    });

    await this.auditLog.log({
      userId,
      aksi: 'ADD_WALI_SANTRI',
      modul: 'santri',
      entitasId: santriId,
      entitasTipe: 'Santri',
      nilaiAfter: { waliId: result.id, waliName: result.name, isPrimary },
      ipAddress,
    });

    return result;
  }

  async linkWali(santriId: string, waliId: string, tenantId: string) {
    await this.assertExists(santriId, tenantId);

    const wali = await this.prisma.wali.findFirst({ where: { id: waliId, tenantId } });
    if (!wali) throw new NotFoundException(`Wali dengan ID ${waliId} tidak ditemukan`);

    const existing = await this.prisma.santriWali.findUnique({
      where: { santriId_waliId: { santriId, waliId } },
    });
    if (existing) return existing;

    const count = await this.prisma.santriWali.count({ where: { santriId } });
    return this.prisma.santriWali.create({
      data: { santriId, waliId, isPrimary: count === 0 },
    });
  }

  // ─── Bulk Import ─────────────────────────────────────────────────────────────

  async generateTemplate(): Promise<any> {
    const workbook = new Workbook();
    const ws = workbook.addWorksheet('Data Santri');

    ws.columns = [
      { header: 'NIS (*)', key: 'nis', width: 15 },
      { header: 'NISN', key: 'nisn', width: 15 },
      { header: 'NAMA LENGKAP (*)', key: 'name', width: 30 },
      { header: 'L/P (*)', key: 'gender', width: 8 },
      { header: 'DOB (YYYY-MM-DD)', key: 'dob', width: 20 },
      { header: 'KELAS', key: 'kelas', width: 15 },
      { header: 'KAMAR/ASRAMA', key: 'room', width: 20 },
      { header: 'KONTAK/HP', key: 'contact', width: 20 },
      { header: 'ALAMAT', key: 'address', width: 40 },
    ];

    ws.addRow({
      nis: 'PSN-2024-001',
      nisn: '1234567890',
      name: 'Fulan bin Fulan',
      gender: 'L',
      dob: '2005-08-17',
      kelas: '10',
      room: 'Abu Bakar 01',
      contact: '081234567890',
      address: 'Jl. Raya Pesantren No. 1',
    });

    ws.getRow(1).font = { bold: true };
    ws.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE0E0E0' } };

    return workbook.xlsx.writeBuffer();
  }

  async bulkImport(tenantId: string, file: any, userId?: string) {
    if (!file) throw new BadRequestException('File Excel wajib diunggah');

    const workbook = new Workbook();
    try {
      await workbook.xlsx.load(file.buffer);
    } catch {
      throw new BadRequestException('Format file tidak valid. Pastikan file berformat .xlsx');
    }

    const ws = workbook.worksheets[0];
    if (!ws) throw new BadRequestException('Sheet utama tidak ditemukan dalam file Excel');

    let successCount = 0;
    let failedCount = 0;
    const errors: string[] = [];
    const rows: Row[] = [];
    ws.eachRow((row, rowNumber) => { if (rowNumber > 1) rows.push(row); });

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      const rowNumber = i + 2;

      try {
        const nis = row.getCell(1).text?.trim() || null;
        const nisn = row.getCell(2).text?.trim() || null;
        const name = row.getCell(3).text?.trim();
        const genderRaw = row.getCell(4).text?.trim()?.toUpperCase();
        const gender = genderRaw === 'L' || genderRaw === 'P' ? genderRaw : 'L';
        const dobRaw = row.getCell(5).value;
        const kelas = row.getCell(6).text?.trim() || null;
        const room = row.getCell(7).text?.trim() || null;
        const contact = row.getCell(8).text?.trim() || null;
        const address = row.getCell(9).text?.trim() || null;

        if (!name) {
          errors.push(`Baris ${rowNumber}: Nama wajib diisi`);
          failedCount++;
          continue;
        }

        if (nis) {
          const nisExists = await this.prisma.santri.findFirst({
            where: { nis, deletedAt: null },
          });
          if (nisExists) {
            errors.push(`Baris ${rowNumber}: NIS '${nis}' sudah digunakan`);
            failedCount++;
            continue;
          }
        }

        let dob: Date | null = null;
        if (dobRaw instanceof Date) dob = dobRaw;
        else if (typeof dobRaw === 'string') {
          const parsed = new Date(dobRaw);
          if (!isNaN(parsed.getTime())) dob = parsed;
        }

        const santri = await this.prisma.santri.create({
          data: { tenantId, nis, nisn, name, namaLengkap: name, gender, jenisKelamin: gender, dob, tanggalLahir: dob, kelas, room, contact, noHp: contact, address, alamat: address, status: 'AKTIF' },
        });

        await this.auditLog.log({
          userId,
          aksi: 'BULK_IMPORT_SANTRI',
          modul: 'santri',
          entitasId: santri.id,
          entitasTipe: 'Santri',
          nilaiAfter: { nis: santri.nis, name: santri.name },
        });

        successCount++;
      } catch (err: any) {
        errors.push(`Baris ${rowNumber}: Gagal menyimpan (${String(err.message).substring(0, 100)})`);
        failedCount++;
      }
    }

    return { message: 'Impor data massal selesai', successCount, failedCount, errors };
  }

  // ─── Promosi Santri → Pengurus/Ustadz ────────────────────────────────────────

  async promote(
    santriId: string,
    tenantId: string,
    role: string = 'PENGURUS',
    userId?: string,
    ipAddress?: string,
  ) {
    const santri = await this.assertExists(santriId, tenantId);

    // Cek apakah sudah punya akun user
    const existingUser = await this.prisma.user.findFirst({
      where: { email: `${santri.nisn || santri.nis || santriId}@pesantren.internal` },
    });

    if (existingUser) {
      // Update role jika sudah ada
      await this.prisma.user.update({
        where: { id: existingUser.id },
        data: { role },
      });
    } else {
      // Buat akun baru dengan password default (NIS/NISN)
      const bcrypt = await import('bcrypt');
      const defaultPassword = santri.nisn || santri.nis || santriId.substring(0, 8);
      const passwordHash = await bcrypt.hash(defaultPassword, 10);

      await this.prisma.user.create({
        data: {
          tenantId,
          email: `${santri.nisn || santri.nis || santriId}@pesantren.internal`,
          name: santri.name,
          passwordHash,
          role,
          isActive: true,
        },
      });
    }

    await this.auditLog.log({
      userId,
      aksi: 'PROMOTE_SANTRI',
      modul: 'santri',
      entitasId: santriId,
      entitasTipe: 'Santri',
      nilaiAfter: { role, santriName: santri.name },
      ipAddress,
    });

    return {
      message: `${santri.name} berhasil dipromosikan sebagai ${role}`,
      defaultPassword: santri.nisn || santri.nis || santriId.substring(0, 8),
    };
  }
}
