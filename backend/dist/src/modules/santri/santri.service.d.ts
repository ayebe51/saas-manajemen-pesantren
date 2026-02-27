import { PrismaService } from '../../common/prisma/prisma.service';
import { CreateSantriDto, UpdateSantriDto, CreateWaliDto } from './dto/santri.dto';
export declare class SantriService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    create(tenantId: string, createSantriDto: CreateSantriDto): Promise<{
        id: string;
        tenantId: string;
        name: string;
        createdAt: Date;
        updatedAt: Date;
        nisn: string | null;
        gender: string;
        dob: Date | null;
        kelas: string | null;
        room: string | null;
        contact: string | null;
        address: string | null;
        photo: string | null;
        status: string;
    }>;
    findAll(tenantId: string, filters: {
        kelas?: string;
        room?: string;
    }): Promise<({
        walis: ({
            wali: {
                id: string;
                email: string | null;
                tenantId: string;
                name: string;
                phone: string;
                createdAt: Date;
                updatedAt: Date;
                address: string | null;
                relation: string;
            };
        } & {
            santriId: string;
            waliId: string;
            isPrimary: boolean;
        })[];
    } & {
        id: string;
        tenantId: string;
        name: string;
        createdAt: Date;
        updatedAt: Date;
        nisn: string | null;
        gender: string;
        dob: Date | null;
        kelas: string | null;
        room: string | null;
        contact: string | null;
        address: string | null;
        photo: string | null;
        status: string;
    })[]>;
    findOne(id: string, tenantId: string): Promise<{
        walis: ({
            wali: {
                id: string;
                email: string | null;
                tenantId: string;
                name: string;
                phone: string;
                createdAt: Date;
                updatedAt: Date;
                address: string | null;
                relation: string;
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
        tenantId: string;
        name: string;
        createdAt: Date;
        updatedAt: Date;
        nisn: string | null;
        gender: string;
        dob: Date | null;
        kelas: string | null;
        room: string | null;
        contact: string | null;
        address: string | null;
        photo: string | null;
        status: string;
    }>;
    update(id: string, tenantId: string, updateSantriDto: UpdateSantriDto): Promise<{
        id: string;
        tenantId: string;
        name: string;
        createdAt: Date;
        updatedAt: Date;
        nisn: string | null;
        gender: string;
        dob: Date | null;
        kelas: string | null;
        room: string | null;
        contact: string | null;
        address: string | null;
        photo: string | null;
        status: string;
    }>;
    bulkImport(tenantId: string, file: any): Promise<{
        message: string;
        successCount: number;
        failedCount: number;
        errors: string[];
    }>;
    addWali(santriId: string, tenantId: string, createWaliDto: CreateWaliDto): Promise<{
        id: string;
        email: string | null;
        tenantId: string;
        name: string;
        phone: string;
        createdAt: Date;
        updatedAt: Date;
        address: string | null;
        relation: string;
    }>;
    linkWali(santriId: string, waliId: string, tenantId: string): Promise<{
        santriId: string;
        waliId: string;
        isPrimary: boolean;
    }>;
}
