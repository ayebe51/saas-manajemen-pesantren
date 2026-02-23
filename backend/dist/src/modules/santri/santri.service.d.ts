import { PrismaService } from '../../common/prisma/prisma.service';
import { CreateSantriDto, UpdateSantriDto, CreateWaliDto } from './dto/santri.dto';
export declare class SantriService {
    private readonly prisma;
    constructor(prisma: PrismaService);
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
    findAll(tenantId: string, filters: {
        kelas?: string;
        room?: string;
    }): Promise<({
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
    update(id: string, tenantId: string, updateSantriDto: UpdateSantriDto): Promise<{
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
    addWali(santriId: string, tenantId: string, createWaliDto: CreateWaliDto): Promise<{
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
    linkWali(santriId: string, waliId: string, tenantId: string): Promise<{
        isPrimary: boolean;
        waliId: string;
        santriId: string;
    }>;
}
