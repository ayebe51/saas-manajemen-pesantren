import { PrismaService } from '../../../common/prisma/prisma.service';
import { NotificationGateway } from '../notification.gateway';
export declare class NotificationEventListener {
    private prisma;
    private notificationGateway;
    private readonly logger;
    constructor(prisma: PrismaService, notificationGateway: NotificationGateway);
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
