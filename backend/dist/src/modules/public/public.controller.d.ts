import { PublicService } from './public.service';
import { BulkSyncSantriDto } from './dto/public.dto';
export declare class PublicController {
    private readonly publicService;
    private readonly logger;
    constructor(publicService: PublicService);
    syncSantri(dto: BulkSyncSantriDto, tenantId: string, req: any): Promise<{
        success: boolean;
        message: string;
        metadata: {
            inserted: number;
            updated: number;
            errors: number;
        };
    }>;
}
