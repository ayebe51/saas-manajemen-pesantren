import { SantriService } from './santri.service';
import { CreateSantriDto, UpdateSantriDto, CreateWaliDto } from './dto/santri.dto';
export declare class SantriController {
    private readonly santriService;
    constructor(santriService: SantriService);
    create(createSantriDto: CreateSantriDto, tenantId: string): Promise<{
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
