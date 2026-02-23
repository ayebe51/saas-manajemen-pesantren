import { PrismaService } from '../../common/prisma/prisma.service';
import { CreateIzinDto, ApproveIzinDto } from './dto/izin.dto';
export declare class PerizinanService {
    private readonly prisma;
    private readonly logger;
    constructor(prisma: PrismaService);
    create(tenantId: string, createIzinDto: CreateIzinDto, requestedBy: string): Promise<{
        type: string;
        id: string;
        status: string;
        createdAt: Date;
        updatedAt: Date;
        tenantId: string;
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
        santriId: string;
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
        type: string;
        id: string;
        status: string;
        createdAt: Date;
        updatedAt: Date;
        tenantId: string;
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
        santriId: string;
    })[]>;
    findOne(id: string, tenantId: string): Promise<{
        santri: {
            walis: ({
                wali: {
                    phone: string;
                    name: string;
                    id: string;
                    address: string | null;
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
            name: string;
            id: string;
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
        };
    } & {
        type: string;
        id: string;
        status: string;
        createdAt: Date;
        updatedAt: Date;
        tenantId: string;
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
        santriId: string;
    }>;
    approve(id: string, approveIzinDto: ApproveIzinDto): Promise<{
        type: string;
        id: string;
        status: string;
        createdAt: Date;
        updatedAt: Date;
        tenantId: string;
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
        santriId: string;
    }>;
    checkout(id: string, tenantId: string, operatorId: string): Promise<{
        type: string;
        id: string;
        status: string;
        createdAt: Date;
        updatedAt: Date;
        tenantId: string;
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
        santriId: string;
    }>;
    checkin(id: string, tenantId: string, operatorId: string): Promise<{
        type: string;
        id: string;
        status: string;
        createdAt: Date;
        updatedAt: Date;
        tenantId: string;
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
        santriId: string;
    }>;
}
