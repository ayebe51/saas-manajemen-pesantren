import { PrismaService } from '../common/prisma/prisma.service';
export declare class ScheduledTasksService {
    private prisma;
    private readonly logger;
    constructor(prisma: PrismaService);
    handlePaymentReminders(): Promise<void>;
    handleExpiredIzin(): Promise<void>;
}
