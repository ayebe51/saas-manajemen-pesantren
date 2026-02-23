import { PrismaService } from '../../common/prisma/prisma.service';
import { CreatePpdbDto } from './dto/ppdb.dto';
export declare class PpdbService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    create(tenantId: string, createPpdbDto: CreatePpdbDto): Promise<void>;
}
