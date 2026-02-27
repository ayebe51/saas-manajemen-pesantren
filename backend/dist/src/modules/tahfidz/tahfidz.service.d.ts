import { PrismaService } from '../../common/prisma/prisma.service';
import { CreateMutabaahDto, CreateTahfidzDto } from './dto/tahfidz.dto';
export declare class TahfidzService {
    private readonly prisma;
    private readonly logger;
    constructor(prisma: PrismaService);
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
    getTahfidzBySantri(tenantId: string, santriId: string): Promise<{
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
    getTahfidzAllSantri(tenantId: string): Promise<({
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
    createOrUpdateMutabaah(tenantId: string, userId: string, dto: CreateMutabaahDto): Promise<{
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
    getMutabaahBySantri(tenantId: string, santriId: string): Promise<{
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
