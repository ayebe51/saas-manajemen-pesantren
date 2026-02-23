import { PrismaService } from '../../common/prisma/prisma.service';
import { CreateCatatanDto, CreatePengumumanDto } from './dto/catatan.dto';
export declare class CatatanService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    createCatatan(tenantId: string, createCatatanDto: CreateCatatanDto, authorId: string): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        tenantId: string;
        santriId: string;
        authorId: string;
        date: Date;
        content: string;
        category: string;
        attachments: string | null;
    }>;
    findAllCatatan(tenantId: string, santriId?: string): Promise<({
        santri: {
            name: string;
            kelas: string | null;
        };
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        tenantId: string;
        santriId: string;
        authorId: string;
        date: Date;
        content: string;
        category: string;
        attachments: string | null;
    })[]>;
    createPengumuman(tenantId: string, createPengumumanDto: CreatePengumumanDto): Promise<{
        title: string;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        tenantId: string;
        content: string;
        audience: string;
        pinnedUntil: Date | null;
    }>;
    findAllPengumuman(tenantId: string, audience?: string): Promise<{
        title: string;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        tenantId: string;
        content: string;
        audience: string;
        pinnedUntil: Date | null;
    }[]>;
}
