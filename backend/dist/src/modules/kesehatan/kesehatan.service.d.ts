import { PrismaService } from '../../common/prisma/prisma.service';
import { CreateHealthRecordDto, CreateMedicationDto } from './dto/kesehatan.dto';
export declare class KesehatanService {
    private readonly prisma;
    private readonly logger;
    constructor(prisma: PrismaService);
    createRecord(tenantId: string, dto: CreateHealthRecordDto, recordedBy: string): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        tenantId: string;
        santriId: string;
        recordedBy: string;
        symptoms: string;
        diagnosis: string | null;
        actionTaken: string | null;
        referred: boolean;
    }>;
    findAllRecords(tenantId: string, santriId?: string): Promise<({
        santri: {
            name: string;
            room: string | null;
        };
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        tenantId: string;
        santriId: string;
        recordedBy: string;
        symptoms: string;
        diagnosis: string | null;
        actionTaken: string | null;
        referred: boolean;
    })[]>;
    createMedication(tenantId: string, dto: CreateMedicationDto): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        santriId: string;
        medicineName: string;
        dose: string;
        schedule: string;
        givenBy: string | null;
        givenAt: Date | null;
    }>;
    markMedicationGiven(medicationId: string, tenantId: string, userId: string): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        santriId: string;
        medicineName: string;
        dose: string;
        schedule: string;
        givenBy: string | null;
        givenAt: Date | null;
    }>;
}
