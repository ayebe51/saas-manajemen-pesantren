import { PrismaService } from '../../common/prisma/prisma.service';
import { BulkSyncSantriDto } from './dto/public.dto';
export declare class PublicService {
    private readonly prisma;
    private readonly logger;
    constructor(prisma: PrismaService);
    bulkUpsertSantri(tenantId: string, dto: BulkSyncSantriDto): Promise<{
        success: boolean;
        message: string;
        metadata: {
            inserted: number;
            updated: number;
            errors: number;
        };
    }>;
}
