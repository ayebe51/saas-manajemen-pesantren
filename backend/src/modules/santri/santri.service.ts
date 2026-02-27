import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { Workbook } from 'exceljs';
import { PrismaService } from '../../common/prisma/prisma.service';
import { CreateSantriDto, UpdateSantriDto, CreateWaliDto } from './dto/santri.dto';

@Injectable()
export class SantriService {
  constructor(private readonly prisma: PrismaService) {}

  async create(tenantId: string, createSantriDto: CreateSantriDto) {
    return this.prisma.santri.create({
      data: {
        ...createSantriDto,
        tenantId,
      },
    });
  }

  async findAll(tenantId: string, filters: { kelas?: string; room?: string }) {
    const whereClause: any = { tenantId };

    if (filters.kelas) whereClause.kelas = filters.kelas;
    if (filters.room) whereClause.room = filters.room;

    return this.prisma.santri.findMany({
      where: whereClause,
      include: {
        walis: {
          include: { wali: true },
        },
      },
      orderBy: { name: 'asc' },
    });
  }

  async findOne(id: string, tenantId: string) {
    const santri = await this.prisma.santri.findFirst({
      where: { id, tenantId },
      include: {
        walis: {
          include: { wali: true },
        },
        _count: {
          select: { izin: true, pelanggaran: true, invoices: true },
        },
      },
    });

    if (!santri) {
      throw new NotFoundException(`Santri with ID ${id} not found`);
    }

    return santri;
  }

  async update(id: string, tenantId: string, updateSantriDto: UpdateSantriDto) {
    // Verify existence and tenant access
    await this.findOne(id, tenantId);

    return this.prisma.santri.update({
      where: { id },
      data: updateSantriDto,
    });
  }

  async bulkImport(tenantId: string, file: any) {
    if (!file) {
      throw new BadRequestException('File Excel wajib diunggah');
    }

    const workbook = new Workbook();
    try {
      await workbook.xlsx.load(file.buffer);
    } catch (e) {
      throw new BadRequestException('Format file tidak valid. Pastikan file berformat .xlsx');
    }

    const worksheet = workbook.worksheets[0];
    if (!worksheet) {
      throw new BadRequestException('Sheet utama tidak ditemukan dalam file Excel');
    }

    let successCount = 0;
    let failedCount = 0;
    const errors: string[] = [];
    const santriDataToInsert: any[] = [];

    // Header Template Expected: A:NISN, B:NAMA, C:L/P, D:DOB YYYY-MM-DD, E:KELAS, F:KAMAR, G:KONTAK, H:ALAMAT
    worksheet.eachRow((row, rowNumber) => {
      // Skip row 1 (Asumsi Header)
      if (rowNumber === 1) return;

      try {
        const nisn = row.getCell(1).text?.trim() || null;
        const name = row.getCell(2).text?.trim();
        const genderRaw = row.getCell(3).text?.trim()?.toUpperCase();
        const gender = genderRaw === 'L' || genderRaw === 'P' ? genderRaw : 'L'; // Default L
        const dobRaw = row.getCell(4).value;
        const kelas = row.getCell(5).text?.trim() || null;
        const room = row.getCell(6).text?.trim() || null;
        const contact = row.getCell(7).text?.trim() || null;
        const address = row.getCell(8).text?.trim() || null;

        if (!name) {
          errors.push(`Baris ${rowNumber}: Nama wajib diisi`);
          failedCount++;
          return;
        }

        let dob: Date | null = null;
        if (dobRaw instanceof Date) {
          dob = dobRaw;
        } else if (typeof dobRaw === 'string') {
          const parsed = new Date(dobRaw);
          if (!isNaN(parsed.getTime())) dob = parsed;
        }

        santriDataToInsert.push({
          tenantId,
          nisn,
          name,
          gender,
          dob,
          kelas,
          room,
          contact,
          address,
          status: 'AKTIF',
        });
        successCount++;
      } catch (err: any) {
        errors.push(`Baris ${rowNumber}: Gagal diproses (${err.message})`);
        failedCount++;
      }
    });

    if (santriDataToInsert.length > 0) {
      await this.prisma.santri.createMany({
        data: santriDataToInsert,
      });
    }

    return {
      message: 'Impor data massal selesai diproses',
      successCount,
      failedCount,
      errors,
    };
  }

  async addWali(santriId: string, tenantId: string, createWaliDto: CreateWaliDto) {
    // Verify santri belongs to tenant
    await this.findOne(santriId, tenantId);

    // Is this the first wali? Make it primary if so
    const existingLinks = await this.prisma.santriWali.count({
      where: { santriId },
    });
    const isPrimary = existingLinks === 0;

    // Create wali and link in transaction
    return this.prisma.$transaction(async (prisma) => {
      const wali = await prisma.wali.create({
        data: {
          ...createWaliDto,
          tenantId,
        },
      });

      await prisma.santriWali.create({
        data: {
          santriId,
          waliId: wali.id,
          isPrimary,
        },
      });

      return wali;
    });
  }

  async linkWali(santriId: string, waliId: string, tenantId: string) {
    // Verify santri
    await this.findOne(santriId, tenantId);

    // Verify wali belongs to tenant
    const wali = await this.prisma.wali.findFirst({
      where: { id: waliId, tenantId },
    });

    if (!wali) {
      throw new NotFoundException(`Wali with ID ${waliId} not found`);
    }

    // Check if link already exists
    const existingLink = await this.prisma.santriWali.findUnique({
      where: { santriId_waliId: { santriId, waliId } },
    });

    if (existingLink) {
      return existingLink; // Already linked
    }

    const existingLinksCount = await this.prisma.santriWali.count({
      where: { santriId },
    });

    return this.prisma.santriWali.create({
      data: {
        santriId,
        waliId,
        isPrimary: existingLinksCount === 0,
      },
    });
  }
}
