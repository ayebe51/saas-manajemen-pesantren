import { PrismaService } from '../../common/prisma/prisma.service';
import { CreatePelanggaranDto, CreatePembinaanDto } from './dto/pelanggaran.dto';
export declare class PelanggaranService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    createPelanggaran(tenantId: string, dto: CreatePelanggaranDto, recordedBy: string): Promise<{
        id: string;
        tenantId: string;
        createdAt: Date;
        updatedAt: Date;
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
        tenantId: string;
        createdAt: Date;
        updatedAt: Date;
        santriId: string;
        description: string;
        date: Date;
        category: string;
        recordedBy: string;
        severity: number;
        points: number;
        resolved: boolean;
    })[]>;
    createPembinaan(tenantId: string, dto: CreatePembinaanDto): Promise<{
        id: string;
        tenantId: string;
        createdAt: Date;
        updatedAt: Date;
        plan: string;
        status: string;
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
        tenantId: string;
        createdAt: Date;
        updatedAt: Date;
        plan: string;
        status: string;
        santriId: string;
        targetDate: Date;
        assignedTo: string;
    })[]>;
}
