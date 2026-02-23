import { PrismaService } from '../../common/prisma/prisma.service';
import { CreateSantriDto, UpdateSantriDto, CreateWaliDto } from './dto/santri.dto';
export declare class SantriService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    create(tenantId: string, createSantriDto: CreateSantriDto): Promise<{
        id: string;
        nisn: string | null;
        name: string;
        gender: string;
        dob: Date | null;
        kelas: string | null;
        room: string | null;
        contact: string | null;
        address: string | null;
        photo: string | null;
        status: string;
        createdAt: Date;
        updatedAt: Date;
        tenantId: string;
    }>;
    findAll(tenantId: string, filters: {
        kelas?: string;
        room?: string;
    }): Promise<({
        walis: ({
            wali: {
                id: string;
                name: string;
                address: string | null;
                createdAt: Date;
                updatedAt: Date;
                tenantId: string;
                relation: string;
                phone: string;
                email: string | null;
            };
        } & {
            santriId: string;
            waliId: string;
            isPrimary: boolean;
        })[];
    } & {
        id: string;
        nisn: string | null;
        name: string;
        gender: string;
        dob: Date | null;
        kelas: string | null;
        room: string | null;
        contact: string | null;
        address: string | null;
        photo: string | null;
        status: string;
        createdAt: Date;
        updatedAt: Date;
        tenantId: string;
    })[]>;
    findOne(id: string, tenantId: string): Promise<{
        walis: ({
            wali: {
                id: string;
                name: string;
                address: string | null;
                createdAt: Date;
                updatedAt: Date;
                tenantId: string;
                relation: string;
                phone: string;
                email: string | null;
            };
        } & {
            santriId: string;
            waliId: string;
            isPrimary: boolean;
        })[];
        _count: {
            izin: number;
            invoices: number;
            pelanggaran: number;
        };
    } & {
        id: string;
        nisn: string | null;
        name: string;
        gender: string;
        dob: Date | null;
        kelas: string | null;
        room: string | null;
        contact: string | null;
        address: string | null;
        photo: string | null;
        status: string;
        createdAt: Date;
        updatedAt: Date;
        tenantId: string;
    }>;
    update(id: string, tenantId: string, updateSantriDto: UpdateSantriDto): Promise<{
        id: string;
        nisn: string | null;
        name: string;
        gender: string;
        dob: Date | null;
        kelas: string | null;
        room: string | null;
        contact: string | null;
        address: string | null;
        photo: string | null;
        status: string;
        createdAt: Date;
        updatedAt: Date;
        tenantId: string;
    }>;
    bulkImport(tenantId: string, file: any): Promise<{
        message: string;
        successCount: number;
        failedCount: number;
        errors: string[];
    }>;
    addWali(santriId: string, tenantId: string, createWaliDto: CreateWaliDto): Promise<{
        id: string;
        name: string;
        address: string | null;
        createdAt: Date;
        updatedAt: Date;
        tenantId: string;
        relation: string;
        phone: string;
        email: string | null;
    }>;
    linkWali(santriId: string, waliId: string, tenantId: string): Promise<{
        santriId: string;
        waliId: string;
        isPrimary: boolean;
    }>;
}
