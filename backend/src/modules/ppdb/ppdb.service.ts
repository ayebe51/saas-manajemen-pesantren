import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { AddPpdbDocumentDto, AddPpdbExamDto, CreatePpdbDto, UpdatePpdbDto } from './dto/ppdb.dto';

@Injectable()
export class PpdbService {
  constructor(private readonly prisma: PrismaService) {}

  async create(tenantId: string, createPpdbDto: CreatePpdbDto) {
    // Generate unique registration number (Example: PPDB-2026-XXXX)
    const count = await this.prisma.ppdbRegistration.count({ where: { tenantId } });
    const regNumber = \`PPDB-\${new Date().getFullYear()}-\${(count + 1).toString().padStart(4, '0')}\`;

    return this.prisma.ppdbRegistration.create({
      data: {
        ...createPpdbDto,
        tenantId,
        registrationNumber: regNumber,
      },
    });
  }

  async findAll(tenantId: string, status?: string) {
    const where: any = { tenantId };
    if (status) where.status = status;

    return this.prisma.ppdbRegistration.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        _count: { select: { documents: true, exams: true } }
      }
    });
  }

  async findOne(tenantId: string, id: string) {
    const registration = await this.prisma.ppdbRegistration.findFirst({
      where: { id, tenantId },
      include: {
        documents: true,
        exams: true,
      },
    });

    if (!registration) throw new NotFoundException('Registration not found');
    return registration;
  }

  async update(tenantId: string, id: string, updatePpdbDto: UpdatePpdbDto) {
    await this.findOne(tenantId, id); // Ensure exists

    return this.prisma.ppdbRegistration.update({
      where: { id },
      data: updatePpdbDto,
    });
  }

  async addDocument(tenantId: string, registrationId: string, addDocDto: AddPpdbDocumentDto) {
    await this.findOne(tenantId, registrationId);

    return this.prisma.ppdbDocument.create({
      data: {
        ...addDocDto,
        tenantId,
        registrationId,
      },
    });
  }

  async addExam(tenantId: string, registrationId: string, addExamDto: AddPpdbExamDto) {
    await this.findOne(tenantId, registrationId);

    return this.prisma.ppdbExam.create({
      data: {
        ...addExamDto,
        tenantId,
        registrationId,
      },
    });
  }
}
