import { PelanggaranService } from './pelanggaran.service';
import { CreatePelanggaranDto, CreatePembinaanDto } from './dto/pelanggaran.dto';
export declare class PelanggaranController {
    private readonly pelanggaranService;
    constructor(pelanggaranService: PelanggaranService);
    createPelanggaran(dto: CreatePelanggaranDto, tenantId: string, req: any): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        tenantId: string;
        santriId: string;
        description: string;
        date: Date;
        category: string;
        recordedBy: string;
        severity: number;
        points: number;
        resolved: boolean;
    }>;
    findAllPelanggaran(tenantId: string, santriId?: string): Promise<({
        santri: {
            name: string;
            kelas: string | null;
        };
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        tenantId: string;
        santriId: string;
        description: string;
        date: Date;
        category: string;
        recordedBy: string;
        severity: number;
        points: number;
        resolved: boolean;
    })[]>;
    createPembinaan(dto: CreatePembinaanDto, tenantId: string): Promise<{
        id: string;
        plan: string;
        status: string;
        createdAt: Date;
        updatedAt: Date;
        tenantId: string;
        santriId: string;
        targetDate: Date;
        assignedTo: string;
    }>;
    findAllPembinaan(tenantId: string, santriId?: string): Promise<({
        santri: {
            name: string;
        };
    } & {
        id: string;
        plan: string;
        status: string;
        createdAt: Date;
        updatedAt: Date;
        tenantId: string;
        santriId: string;
        targetDate: Date;
        assignedTo: string;
    })[]>;
}
