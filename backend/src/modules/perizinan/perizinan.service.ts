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

    // Workflow: Sakit -> POSKESTREN dulu. Keluar/Pulang -> MUSYRIF dulu.
    const initialStatus = createIzinDto.type === 'SAKIT' ? 'PENDING_POSKESTREN' : 'PENDING_MUSYRIF';

    const izin = await this.prisma.izin.create({
      data: {
        tenantId,
        santriId: createIzinDto.santriId,
        type: createIzinDto.type,
        reason: createIzinDto.reason,
        startAt: new Date(createIzinDto.startAt),
        endAt: new Date(createIzinDto.endAt),
        status: initialStatus,
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
    const izin = await this.prisma.izin.findUnique({
      where: { id },
    });

    if (!izin) throw new NotFoundException('Izin request not found');

    if (izin.status === 'APPROVED_WAITING_CHECKOUT' || izin.status === 'REJECTED') {
      throw new BadRequestException(`Izin is already ${izin.status}`);
    }

    // Role-based verification can be added here if needed
    // e.g. checking if approverId is a Wali / Musyrif / Poskestren

    let nextStatus = approveIzinDto.status;

    // Auto-escalation Logic
    if (approveIzinDto.status === 'APPROVED') {
      if (izin.status === 'PENDING_POSKESTREN') {
        nextStatus = 'PENDING_MUSYRIF'; // Poskestren setuju -> lanjut ke Musyrif
      } else if (izin.status === 'PENDING_MUSYRIF') {
        nextStatus = 'APPROVED_WAITING_CHECKOUT'; // Musyrif setuju -> Izin Valid
      }
    }

    return this.prisma.izin.update({
      where: { id },
      data: {
        status: nextStatus,
        approvedBy: approveIzinDto.approverId,
        approvedAt: new Date(),
        reason: approveIzinDto.notes
          ? `${izin.reason} | Note: ${approveIzinDto.notes}`
          : izin.reason,
      },
    });
  }

  async checkout(id: string, tenantId: string, operatorId: string) {
    const izin = await this.findOne(id, tenantId);

    if (izin.status !== 'APPROVED_WAITING_CHECKOUT') {
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
