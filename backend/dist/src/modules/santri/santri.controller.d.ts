import { SantriService } from './santri.service';
import { CreateSantriDto, UpdateSantriDto, CreateWaliDto } from './dto/santri.dto';
export declare class SantriController {
    private readonly santriService;
    constructor(santriService: SantriService);
    create(tenantId: string, createSantriDto: CreateSantriDto): Promise<{
        id: string;
        name: string;
        address: string | null;
        status: string;
        createdAt: Date;
        updatedAt: Date;
        tenantId: string;
        nisn: string | null;
        gender: string;
        dob: Date | null;
        kelas: string | null;
        room: string | null;
        contact: string | null;
        photo: string | null;
    }>;
    importSantri(tenantId: string, file: Express.Multer.File): Promise<{
        success: boolean;
        message: string;
        data: {
            inserted: number;
            failed: number;
        };
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
                phone: string;
                createdAt: Date;
                updatedAt: Date;
                email: string | null;
                tenantId: string;
                relation: string;
            };
        } & {
            isPrimary: boolean;
            waliId: string;
            santriId: string;
        })[];
    } & {
        id: string;
        name: string;
        address: string | null;
        status: string;
        createdAt: Date;
        updatedAt: Date;
        tenantId: string;
        nisn: string | null;
        gender: string;
        dob: Date | null;
        kelas: string | null;
        room: string | null;
        contact: string | null;
        photo: string | null;
    })[]>;
    findOne(id: string, tenantId: string): Promise<{
        walis: ({
            wali: {
                id: string;
                name: string;
                address: string | null;
                phone: string;
                createdAt: Date;
                updatedAt: Date;
                email: string | null;
                tenantId: string;
                relation: string;
            };
        } & {
            isPrimary: boolean;
            waliId: string;
            santriId: string;
        })[];
        _count: {
            izin: number;
            invoices: number;
            pelanggaran: number;
        };
    } & {
        id: string;
        name: string;
        address: string | null;
        status: string;
        createdAt: Date;
        updatedAt: Date;
        tenantId: string;
        nisn: string | null;
        gender: string;
        dob: Date | null;
        kelas: string | null;
        room: string | null;
        contact: string | null;
        photo: string | null;
    }>;
    update(id: string, updateSantriDto: UpdateSantriDto, tenantId: string): Promise<{
        id: string;
        name: string;
        address: string | null;
        status: string;
        createdAt: Date;
        updatedAt: Date;
        tenantId: string;
        nisn: string | null;
        gender: string;
        dob: Date | null;
        kelas: string | null;
        room: string | null;
        contact: string | null;
        photo: string | null;
    }>;
    addWali(santriId: string, createWaliDto: CreateWaliDto, tenantId: string): Promise<{
        id: string;
        name: string;
        address: string | null;
        phone: string;
        createdAt: Date;
        updatedAt: Date;
        email: string | null;
        tenantId: string;
        relation: string;
    }>;
    linkExistingWali(santriId: string, waliId: string, tenantId: string): Promise<{
        isPrimary: boolean;
        waliId: string;
        santriId: string;
    }>;
}
