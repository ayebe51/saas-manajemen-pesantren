import { SantriService } from './santri.service';
import { CreateSantriDto, UpdateSantriDto, CreateWaliDto } from './dto/santri.dto';
export declare class SantriController {
    private readonly santriService;
    constructor(santriService: SantriService);
    create(createSantriDto: CreateSantriDto, tenantId: string): Promise<{
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
    update(id: string, updateSantriDto: UpdateSantriDto, tenantId: string): Promise<{
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
    addWali(santriId: string, createWaliDto: CreateWaliDto, tenantId: string): Promise<{
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
    linkExistingWali(santriId: string, waliId: string, tenantId: string): Promise<{
        santriId: string;
        waliId: string;
        isPrimary: boolean;
    }>;
}
