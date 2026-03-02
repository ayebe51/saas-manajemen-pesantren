import { PrismaService } from '../../../common/prisma/prisma.service';
export declare class SppSchedulerService {
    private prisma;
    private readonly logger;
    constructor(prisma: PrismaService);
    handleSppReminderCron(): Promise<void>;
}
