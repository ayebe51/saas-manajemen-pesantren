import { PrismaService } from '../../common/prisma/prisma.service';
import { CreatePaymentDto, ManualResolveDepositDto, MootaWebhookDto, RequestDepositDto } from './dto/wallet.dto';
export declare class WalletService {
    private readonly prisma;
    private readonly logger;
    constructor(prisma: PrismaService);
    getWallet(tenantId: string, santriId: string): Promise<{
        transactions: {
            id: string;
            status: string;
            createdAt: Date;
            type: string;
            description: string | null;
            amount: number;
            method: string;
            walletId: string;
            reference: string | null;
            handledBy: string | null;
        }[];
    } & {
        id: string;
        updatedAt: Date;
        isActive: boolean;
        tenantId: string;
        santriId: string;
        pin: string | null;
        balance: number;
    }>;
    requestDeposit(tenantId: string, dto: RequestDepositDto): Promise<{
        message: string;
        uniqueAmount: number;
        transaction: {
            id: string;
            status: string;
            createdAt: Date;
            type: string;
            description: string | null;
            amount: number;
            method: string;
            walletId: string;
            reference: string | null;
            handledBy: string | null;
        };
    }>;
    manualResolveDeposit(tenantId: string, userId: string, dto: ManualResolveDepositDto): Promise<{
        id: string;
        status: string;
        createdAt: Date;
        type: string;
        description: string | null;
        amount: number;
        method: string;
        walletId: string;
        reference: string | null;
        handledBy: string | null;
    }>;
    makePayment(tenantId: string, cashierId: string, dto: CreatePaymentDto): Promise<{
        id: string;
        status: string;
        createdAt: Date;
        type: string;
        description: string | null;
        amount: number;
        method: string;
        walletId: string;
        reference: string | null;
        handledBy: string | null;
    }>;
    handleMootaWebhook(tenantId: string, payload: MootaWebhookDto[]): Promise<{
        success: number;
        failed: number;
        skipped: number;
    }>;
}
