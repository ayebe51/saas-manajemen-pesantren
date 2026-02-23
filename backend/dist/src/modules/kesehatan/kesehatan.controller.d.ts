import { KesehatanService } from './kesehatan.service';
import { CreateHealthRecordDto, CreateMedicationDto } from './dto/kesehatan.dto';
export declare class KesehatanController {
    private readonly kesehatanService;
    constructor(kesehatanService: KesehatanService);
    createRecord(dto: CreateHealthRecordDto, tenantId: string, req: any): Promise<{
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
    createMedication(dto: CreateMedicationDto, tenantId: string): Promise<{
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
    markGiven(id: string, tenantId: string, req: any): Promise<{
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
