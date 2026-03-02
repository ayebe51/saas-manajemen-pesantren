import { SantriService } from './santri.service';
import { CreateSantriDto, UpdateSantriDto, CreateWaliDto } from './dto/santri.dto';
export declare class SantriController {
    private readonly santriService;
    constructor(santriService: SantriService);
    create(tenantId: string, createSantriDto: CreateSantriDto): Promise<{
        name: string;
        id: string;
        tenantId: string;
        nisn: string | null;
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
                name: string;
                id: string;
                tenantId: string;
                address: string | null;
                createdAt: Date;
                updatedAt: Date;
                relation: string;
                phone: string;
                email: string | null;
            };
        } & {
            isPrimary: boolean;
            santriId: string;
            waliId: string;
        })[];
    } & {
        name: string;
        id: string;
        tenantId: string;
        nisn: string | null;
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
    })[]>;
    findOne(id: string, tenantId: string): Promise<{
        walis: ({
            wali: {
                name: string;
                id: string;
                tenantId: string;
                address: string | null;
                createdAt: Date;
                updatedAt: Date;
                relation: string;
                phone: string;
                email: string | null;
            };
        } & {
            isPrimary: boolean;
            santriId: string;
            waliId: string;
        })[];
        _count: {
            izin: number;
            invoices: number;
            pelanggaran: number;
        };
    } & {
        name: string;
        id: string;
        tenantId: string;
        nisn: string | null;
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
    }>;
    update(id: string, updateSantriDto: UpdateSantriDto, tenantId: string): Promise<{
        name: string;
        id: string;
        tenantId: string;
        nisn: string | null;
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
    }>;
    addWali(santriId: string, createWaliDto: CreateWaliDto, tenantId: string): Promise<{
        name: string;
        id: string;
        tenantId: string;
        address: string | null;
        createdAt: Date;
        updatedAt: Date;
        relation: string;
        phone: string;
        email: string | null;
    }>;
    linkExistingWali(santriId: string, waliId: string, tenantId: string): Promise<{
        isPrimary: boolean;
        santriId: string;
        waliId: string;
    }>;
}
