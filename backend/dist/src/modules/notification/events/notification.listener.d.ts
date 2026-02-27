import { Queue } from 'bullmq';
import { PrismaService } from '../../../common/prisma/prisma.service';
export declare class NotificationEventListener {
    private prisma;
    private waQueue;
    private readonly logger;
    constructor(prisma: PrismaService, waQueue: Queue);
    handlePelanggaranEvent(payload: {
        santriId: string;
        ruleName: string;
        points: number;
        date: Date;
    }): Promise<void>;
    handleWalletTopUpSuccess(payload: {
        walletId: string;
        amount: number;
        trxId: string;
    }): Promise<void>;
}
