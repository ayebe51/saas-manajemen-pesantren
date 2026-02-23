import { CatatanService } from './catatan.service';
import { CreateCatatanDto, CreatePengumumanDto } from './dto/catatan.dto';
export declare class CatatanController {
    private readonly catatanService;
    constructor(catatanService: CatatanService);
    createCatatan(createCatatanDto: CreateCatatanDto, tenantId: string, req: any): Promise<{
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
    createPengumuman(createPengumumanDto: CreatePengumumanDto, tenantId: string): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        tenantId: string;
        content: string;
        title: string;
        audience: string;
        pinnedUntil: Date | null;
    }>;
    findAllPengumuman(tenantId: string, audience?: string): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        tenantId: string;
        content: string;
        title: string;
        audience: string;
        pinnedUntil: Date | null;
    }[]>;
}
