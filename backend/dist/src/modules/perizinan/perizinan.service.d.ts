import { PrismaService } from '../../common/prisma/prisma.service';
import { CreateIzinDto, ApproveIzinDto } from './dto/izin.dto';
export declare class PerizinanService {
    private readonly prisma;
    private readonly logger;
    constructor(prisma: PrismaService);
    create(tenantId: string, createIzinDto: CreateIzinDto, requestedBy: string): Promise<{
        id: string;
        tenantId: string;
        createdAt: Date;
        updatedAt: Date;
        type: string;
        status: string;
        santriId: string;
        reason: string;
        startAt: Date;
        endAt: Date;
        requestedBy: string;
        approvedBy: string | null;
        approvedAt: Date | null;
        qrCodeData: string | null;
        checkoutAt: Date | null;
        checkoutBy: string | null;
        checkinAt: Date | null;
        checkinBy: string | null;
    }>;
    findAll(tenantId: string, filters: {
        status?: string;
        santriId?: string;
    }): Promise<({
        santri: {
            name: string;
            kelas: string | null;
            room: string | null;
        };
    } & {
        id: string;
        tenantId: string;
        createdAt: Date;
        updatedAt: Date;
        type: string;
        status: string;
        santriId: string;
        reason: string;
        startAt: Date;
        endAt: Date;
        requestedBy: string;
        approvedBy: string | null;
        approvedAt: Date | null;
        qrCodeData: string | null;
        checkoutAt: Date | null;
        checkoutBy: string | null;
        checkinAt: Date | null;
        checkinBy: string | null;
    })[]>;
    findOne(id: string, tenantId: string): Promise<{
        santri: {
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
        };
    } & {
        id: string;
        tenantId: string;
        createdAt: Date;
        updatedAt: Date;
        type: string;
        status: string;
        santriId: string;
        reason: string;
        startAt: Date;
        endAt: Date;
        requestedBy: string;
        approvedBy: string | null;
        approvedAt: Date | null;
        qrCodeData: string | null;
        checkoutAt: Date | null;
        checkoutBy: string | null;
        checkinAt: Date | null;
        checkinBy: string | null;
    }>;
    approve(id: string, approveIzinDto: ApproveIzinDto): Promise<{
        id: string;
        tenantId: string;
        createdAt: Date;
        updatedAt: Date;
        type: string;
        status: string;
        santriId: string;
        reason: string;
        startAt: Date;
        endAt: Date;
        requestedBy: string;
        approvedBy: string | null;
        approvedAt: Date | null;
        qrCodeData: string | null;
        checkoutAt: Date | null;
        checkoutBy: string | null;
        checkinAt: Date | null;
        checkinBy: string | null;
    }>;
    checkout(id: string, tenantId: string, operatorId: string): Promise<{
        id: string;
        tenantId: string;
        createdAt: Date;
        updatedAt: Date;
        type: string;
        status: string;
        santriId: string;
        reason: string;
        startAt: Date;
        endAt: Date;
        requestedBy: string;
        approvedBy: string | null;
        approvedAt: Date | null;
        qrCodeData: string | null;
        checkoutAt: Date | null;
        checkoutBy: string | null;
        checkinAt: Date | null;
        checkinBy: string | null;
    }>;
    checkin(id: string, tenantId: string, operatorId: string): Promise<{
        id: string;
        tenantId: string;
        createdAt: Date;
        updatedAt: Date;
        type: string;
        status: string;
        santriId: string;
        reason: string;
        startAt: Date;
        endAt: Date;
        requestedBy: string;
        approvedBy: string | null;
        approvedAt: Date | null;
        qrCodeData: string | null;
        checkoutAt: Date | null;
        checkoutBy: string | null;
        checkinAt: Date | null;
        checkinBy: string | null;
    }>;
}
