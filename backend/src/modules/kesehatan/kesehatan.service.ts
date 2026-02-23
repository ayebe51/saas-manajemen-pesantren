import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { CreateHealthRecordDto, CreateMedicationDto } from './dto/kesehatan.dto';

@Injectable()
export class KesehatanService {
  private readonly logger = new Logger(KesehatanService.name);

  constructor(private readonly prisma: PrismaService) {}

  async createRecord(tenantId: string, dto: CreateHealthRecordDto, recordedBy: string) {
    const santri = await this.prisma.santri.findFirst({
      where: { id: dto.santriId, tenantId },
      include: {
        walis: {
          where: { isPrimary: true },
          include: { wali: true }
        }
      }
    });

    if (!santri) {
      throw new NotFoundException('Santri not found');
    }

    const record = await this.prisma.healthRecord.create({
      data: {
        tenantId,
        santriId: dto.santriId,
        recordedBy,
        symptoms: dto.symptoms,
        diagnosis: dto.diagnosis,
        actionTaken: dto.actionTaken,
        referred: dto.referred || false,
      }
    });

    if (dto.referred && santri.walis.length > 0) {
      // Trigger notification if referred to hospital/clinic
      this.logger.log(`[Job Trigger] Send WA Alert Health Referral to Wali: ${santri.walis[0].wali.phone} for Santri ${santri.name}`);
    }

    return record;
  }

  async findAllRecords(tenantId: string, santriId?: string) {
    const whereClause: any = { tenantId };
    if (santriId) whereClause.santriId = santriId;

    return this.prisma.healthRecord.findMany({
      where: whereClause,
      include: {
        santri: { select: { name: true, room: true } }
      },
      orderBy: { createdAt: 'desc' }
    });
  }

  async createMedication(tenantId: string, dto: CreateMedicationDto) {
    const santri = await this.prisma.santri.findFirst({
      where: { id: dto.santriId, tenantId }
    });

    if (!santri) {
      throw new NotFoundException('Santri not found');
    }

    return this.prisma.medication.create({
      data: {
        santriId: dto.santriId,
        medicineName: dto.medicineName,
        dose: dto.dose,
        schedule: dto.schedule,
      }
    });
  }

  async markMedicationGiven(medicationId: string, tenantId: string, userId: string) {
    const med = await this.prisma.medication.findUnique({
      where: { id: medicationId },
      include: { santri: true }
    });

    if (!med || med.santri.tenantId !== tenantId) {
      throw new NotFoundException('Medication schedule not found');
    }

    return this.prisma.medication.update({
      where: { id: medicationId },
      data: {
        givenBy: userId,
        givenAt: new Date(),
      }
    });
  }
}
