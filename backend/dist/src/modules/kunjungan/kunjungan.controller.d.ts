import { KunjunganService } from './kunjungan.service';
import { CreateKunjunganDto } from './dto/kunjungan.dto';
export declare class KunjunganController {
    private readonly kunjunganService;
    constructor(kunjunganService: KunjunganService);
    create(dto: CreateKunjunganDto, tenantId: string): Promise<{
        id: string;
        status: string;
        createdAt: Date;
        updatedAt: Date;
        tenantId: string;
        santriId: string;
        scheduledAt: Date;
        slot: string;
        visitorLimit: number;
    }>;
    findAll(tenantId: string, date?: string, santriId?: string): Promise<({
        santri: {
            name: string;
            room: string | null;
        };
        tamu: {
            phone: string | null;
            name: string;
            id: string;
            createdAt: Date;
            checkinAt: Date | null;
            kunjunganId: string;
            idNumber: string | null;
        }[];
    } & {
        id: string;
        status: string;
        createdAt: Date;
        updatedAt: Date;
        tenantId: string;
        santriId: string;
        scheduledAt: Date;
        slot: string;
        visitorLimit: number;
    })[]>;
    getSlots(tenantId: string, date: string): Promise<{
        slot: string;
        booked: number;
        available: number;
        isFull: boolean;
    }[]>;
    checkin(id: string, tenantId: string, visitorName: string): Promise<{
        tamu: {
            phone: string | null;
            name: string;
            id: string;
            createdAt: Date;
            checkinAt: Date | null;
            kunjunganId: string;
            idNumber: string | null;
        }[];
    } & {
        id: string;
        status: string;
        createdAt: Date;
        updatedAt: Date;
        tenantId: string;
        santriId: string;
        scheduledAt: Date;
        slot: string;
        visitorLimit: number;
    }>;
}
