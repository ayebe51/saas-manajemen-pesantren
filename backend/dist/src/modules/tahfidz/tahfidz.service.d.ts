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
        grade: string | null;
        recordedBy: string;
        surah: string;
        ayat: string | null;
        notes: string | null;
    }>;
    getTahfidzBySantri(tenantId: string, santriId: string): Promise<{
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
    createOrUpdateMutabaah(tenantId: string, userId: string, dto: CreateMutabaahDto): Promise<{
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
    getMutabaahBySantri(tenantId: string, santriId: string): Promise<{
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
