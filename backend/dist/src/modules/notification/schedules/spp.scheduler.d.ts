import { PrismaService } from '../../../common/prisma/prisma.service';
import { Queue } from 'bullmq';
export declare class SppSchedulerService {
    private prisma;
    private waQueue;
    private readonly logger;
    constructor(prisma: PrismaService, waQueue: Queue);
    handleSppReminderCron(): Promise<void>;
}
