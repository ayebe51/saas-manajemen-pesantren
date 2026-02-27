import { CreateMutabaahDto, CreateTahfidzDto } from './dto/tahfidz.dto';
import { TahfidzService } from './tahfidz.service';
export declare class TahfidzController {
    private readonly tahfidzService;
    constructor(tahfidzService: TahfidzService);
    createTahfidz(tenantId: string, userId: string, dto: CreateTahfidzDto): Promise<{
        id: string;
        createdAt: Date;
        tenantId: string;
        type: string;
        santriId: string;
        date: Date;
        surah: string;
        ayat: string | null;
        grade: string | null;
        notes: string | null;
        recordedBy: string;
    }>;
    getTahfidzHistory(tenantId: string, santriId: string): Promise<{
        id: string;
        createdAt: Date;
        tenantId: string;
        type: string;
        santriId: string;
        date: Date;
        surah: string;
        ayat: string | null;
        grade: string | null;
        notes: string | null;
        recordedBy: string;
    }[]>;
    getAllTahfidzHistory(tenantId: string): Promise<({
        santri: {
            name: string;
            kelas: string | null;
        };
    } & {
        id: string;
        createdAt: Date;
        tenantId: string;
        type: string;
        santriId: string;
        date: Date;
        surah: string;
        ayat: string | null;
        grade: string | null;
        notes: string | null;
        recordedBy: string;
    })[]>;
    createMutabaah(tenantId: string, userId: string, dto: CreateMutabaahDto): Promise<{
        id: string;
        createdAt: Date;
        tenantId: string;
        santriId: string;
        date: Date;
        notes: string | null;
        recordedBy: string | null;
        sholatWajib: boolean;
        tahajud: boolean;
        dhuha: boolean;
        puasaSunnah: boolean;
        bacaQuran: boolean;
    }>;
    getMutabaahHistory(tenantId: string, santriId: string): Promise<{
        id: string;
        createdAt: Date;
        tenantId: string;
        santriId: string;
        date: Date;
        notes: string | null;
        recordedBy: string | null;
        sholatWajib: boolean;
        tahajud: boolean;
        dhuha: boolean;
        puasaSunnah: boolean;
        bacaQuran: boolean;
    }[]>;
}
