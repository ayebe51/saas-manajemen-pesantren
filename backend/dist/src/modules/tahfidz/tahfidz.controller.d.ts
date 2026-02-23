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
        grade: string | null;
        recordedBy: string;
        surah: string;
        ayat: string | null;
        notes: string | null;
    }>;
    getTahfidzHistory(tenantId: string, santriId: string): Promise<{
        id: string;
        createdAt: Date;
        tenantId: string;
        type: string;
        santriId: string;
        date: Date;
        grade: string | null;
        recordedBy: string;
        surah: string;
        ayat: string | null;
        notes: string | null;
    }[]>;
    createMutabaah(tenantId: string, userId: string, dto: CreateMutabaahDto): Promise<{
        id: string;
        createdAt: Date;
        tenantId: string;
        santriId: string;
        date: Date;
        recordedBy: string | null;
        notes: string | null;
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
        recordedBy: string | null;
        notes: string | null;
        sholatWajib: boolean;
        tahajud: boolean;
        dhuha: boolean;
        puasaSunnah: boolean;
        bacaQuran: boolean;
    }[]>;
}
