import { CatatanService } from './catatan.service';
import { CreateCatatanDto, CreatePengumumanDto } from './dto/catatan.dto';
export declare class CatatanController {
    private readonly catatanService;
    constructor(catatanService: CatatanService);
    createCatatan(createCatatanDto: CreateCatatanDto, tenantId: string, req: any): Promise<{
        id: string;
        tenantId: string;
        createdAt: Date;
        updatedAt: Date;
        santriId: string;
        content: string;
        authorId: string;
        date: Date;
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
        tenantId: string;
        createdAt: Date;
        updatedAt: Date;
        santriId: string;
        content: string;
        authorId: string;
        date: Date;
        category: string;
        attachments: string | null;
    })[]>;
    createPengumuman(createPengumumanDto: CreatePengumumanDto, tenantId: string): Promise<{
        id: string;
        tenantId: string;
        createdAt: Date;
        updatedAt: Date;
        content: string;
        title: string;
        audience: string;
        pinnedUntil: Date | null;
    }>;
    findAllPengumuman(tenantId: string, audience?: string): Promise<{
        id: string;
        tenantId: string;
        createdAt: Date;
        updatedAt: Date;
        content: string;
        title: string;
        audience: string;
        pinnedUntil: Date | null;
    }[]>;
}
