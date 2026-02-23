import { PerizinanService } from './perizinan.service';
import { CreateIzinDto, ApproveIzinDto } from './dto/izin.dto';
export declare class PerizinanController {
    private readonly perizinanService;
    constructor(perizinanService: PerizinanService);
    create(createIzinDto: CreateIzinDto, tenantId: string, req: any): Promise<{
        id: string;
        tenantId: string;
        createdAt: Date;
        updatedAt: Date;
        status: string;
        santriId: string;
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
    }>;
    findAll(tenantId: string, status?: string, santriId?: string): Promise<({
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
        status: string;
        santriId: string;
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
                isPrimary: boolean;
                santriId: string;
                waliId: string;
            })[];
        } & {
            id: string;
            tenantId: string;
            name: string;
            createdAt: Date;
            updatedAt: Date;
            address: string | null;
            status: string;
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
        tenantId: string;
        createdAt: Date;
        updatedAt: Date;
        status: string;
        santriId: string;
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
    }>;
    approve(id: string, approveIzinDto: ApproveIzinDto): Promise<{
        id: string;
        tenantId: string;
        createdAt: Date;
        updatedAt: Date;
        status: string;
        santriId: string;
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
    }>;
    checkout(id: string, tenantId: string, req: any): Promise<{
        id: string;
        tenantId: string;
        createdAt: Date;
        updatedAt: Date;
        status: string;
        santriId: string;
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
    }>;
    checkin(id: string, tenantId: string, req: any): Promise<{
        id: string;
        tenantId: string;
        createdAt: Date;
        updatedAt: Date;
        status: string;
        santriId: string;
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
    }>;
}
