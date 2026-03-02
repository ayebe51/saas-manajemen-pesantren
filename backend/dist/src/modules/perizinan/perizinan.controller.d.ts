import { PerizinanService } from './perizinan.service';
import { CreateIzinDto, ApproveIzinDto } from './dto/izin.dto';
export declare class PerizinanController {
    private readonly perizinanService;
    constructor(perizinanService: PerizinanService);
    create(createIzinDto: CreateIzinDto, tenantId: string, req: any): Promise<{
        id: string;
        status: string;
        createdAt: Date;
        updatedAt: Date;
        tenantId: string;
        type: string;
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
    findAll(tenantId: string, status?: string, santriId?: string): Promise<({
        santri: {
            name: string;
            kelas: string | null;
            room: string | null;
        };
    } & {
        id: string;
        status: string;
        createdAt: Date;
        updatedAt: Date;
        tenantId: string;
        type: string;
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
        };
    } & {
        id: string;
        status: string;
        createdAt: Date;
        updatedAt: Date;
        tenantId: string;
        type: string;
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
        id: string;
        status: string;
        createdAt: Date;
        updatedAt: Date;
        tenantId: string;
        type: string;
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
    checkout(id: string, tenantId: string, req: any): Promise<{
        id: string;
        status: string;
        createdAt: Date;
        updatedAt: Date;
        tenantId: string;
        type: string;
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
    checkin(id: string, tenantId: string, req: any): Promise<{
        id: string;
        status: string;
        createdAt: Date;
        updatedAt: Date;
        tenantId: string;
        type: string;
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
