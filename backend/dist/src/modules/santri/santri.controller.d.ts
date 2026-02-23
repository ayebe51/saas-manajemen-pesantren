import { SantriService } from './santri.service';
import { CreateSantriDto, UpdateSantriDto, CreateWaliDto } from './dto/santri.dto';
export declare class SantriController {
    private readonly santriService;
    constructor(santriService: SantriService);
    create(createSantriDto: CreateSantriDto, tenantId: string): Promise<{
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
    bulkImport(file: any, tenantId: string): Promise<{
        message: string;
        successCount: number;
        failedCount: number;
        errors: string[];
    }>;
    findAll(tenantId: string, kelas?: string, room?: string): Promise<({
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
    update(id: string, updateSantriDto: UpdateSantriDto, tenantId: string): Promise<{
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
    addWali(santriId: string, createWaliDto: CreateWaliDto, tenantId: string): Promise<{
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
    linkExistingWali(santriId: string, waliId: string, tenantId: string): Promise<{
        santriId: string;
        waliId: string;
        isPrimary: boolean;
    }>;
}
