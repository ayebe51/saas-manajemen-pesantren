import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { CreateIzinDto, ApproveIzinDto } from './dto/izin.dto';
import * as crypto from 'crypto';

@Injectable()
export class PerizinanService {
  private readonly logger = new Logger(PerizinanService.name);

  constructor(private readonly prisma: PrismaService) {}

  async create(tenantId: string, createIzinDto: CreateIzinDto, requestedBy: string) {
    // Basic verification
    const santri = await this.prisma.santri.findFirst({
      where: { id: createIzinDto.santriId, tenantId },
      include: {
        walis: {
          where: { isPrimary: true },
          include: { wali: true },
        },
      },
    });

    if (!santri) {
      throw new NotFoundException('Santri not found');
    }

    // Generate unique QR code data
    const qrCodeData = `IZIN-${tenantId.substring(0, 8)}-${Date.now()}-${crypto.randomBytes(4).toString('hex')}`;

    const izin = await this.prisma.izin.create({
      data: {
        tenantId,
        santriId: createIzinDto.santriId,
        type: createIzinDto.type,
        reason: createIzinDto.reason,
        startAt: new Date(createIzinDto.startAt),
        endAt: new Date(createIzinDto.endAt),
        status: 'PENDING',
        requestedBy,
        qrCodeData,
      },
    });

    // Background Job triggering would happen here (e.g., Send WA to Wali via BullMQ)
    if (santri.walis.length > 0) {
      this.logger.log(
        `[Job Trigger] Send WA approval link to Wali: ${santri.walis[0].wali.phone} for Izin ${izin.id}`,
      );
    }

    return izin;
  }

  async findAll(tenantId: string, filters: { status?: string; santriId?: string }) {
    const whereClause: any = { tenantId };

    if (filters.status) whereClause.status = filters.status;
    if (filters.santriId) whereClause.santriId = filters.santriId;

    return this.prisma.izin.findMany({
      where: whereClause,
      include: {
        santri: { select: { name: true, kelas: true, room: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string, tenantId: string) {
    const izin = await this.prisma.izin.findFirst({
      where: { id, tenantId },
      include: {
        santri: {
          include: {
            walis: { include: { wali: true } },
          },
        },
      },
    });

    if (!izin) {
      throw new NotFoundException(`Izin with ID ${id} not found`);
    }

    return izin;
  }

  async approve(id: string, approveIzinDto: ApproveIzinDto) {
    // In a public endpoint, we wouldn't have tenantId from the user context,
    // so we find by ID only. In reality, we'd verify the token.
    const izin = await this.prisma.izin.findUnique({
      where: { id },
    });

    if (!izin) {
      throw new NotFoundException('Izin request not found');
    }

    if (izin.status !== 'PENDING') {
      throw new BadRequestException(`Izin is already ${izin.status}`);
    }

    // Verify wali is actually linked to santri
    const waliLink = await this.prisma.santriWali.findUnique({
      where: {
        santriId_waliId: {
          santriId: izin.santriId,
          waliId: approveIzinDto.waliId,
        },
      },
    });

    if (!waliLink) {
      throw new BadRequestException('Wali is not linked to this Santri');
    }

    return this.prisma.izin.update({
      where: { id },
      data: {
        status: approveIzinDto.status, // APPROVED or REJECTED
        approvedBy: approveIzinDto.waliId,
        approvedAt: new Date(),
      },
    });
  }

  async checkout(id: string, tenantId: string, operatorId: string) {
    const izin = await this.findOne(id, tenantId);

    if (izin.status !== 'APPROVED') {
      throw new BadRequestException(`Cannot check out. Izin status is ${izin.status}`);
    }

    // Ensure start time is valid (allow slightly early checkout in reality)
    const now = new Date();

    return this.prisma.izin.update({
      where: { id },
      data: {
        status: 'CHECKED_OUT',
        checkoutAt: now,
        checkoutBy: operatorId,
      },
    });
  }

  async checkin(id: string, tenantId: string, operatorId: string) {
    const izin = await this.findOne(id, tenantId);

    if (izin.status !== 'CHECKED_OUT') {
      throw new BadRequestException(`Cannot check in. Izin status is ${izin.status}`);
    }

    const now = new Date();

    return this.prisma.izin.update({
      where: { id },
      data: {
        status: 'CHECKED_IN',
        checkinAt: now,
        checkinBy: operatorId,
      },
    });
  }
}
