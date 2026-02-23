import { CreatePaymentDto, ManualResolveDepositDto, MootaWebhookDto, RequestDepositDto } from './dto/wallet.dto';
import { WalletService } from './wallet.service';
export declare class WalletController {
    private readonly walletService;
    constructor(walletService: WalletService);
    getWallet(tenantId: string, santriId: string): Promise<{
        transactions: {
            method: string;
            type: string;
            id: string;
            status: string;
            createdAt: Date;
            description: string | null;
            amount: number;
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
            method: string;
            type: string;
            id: string;
            status: string;
            createdAt: Date;
            description: string | null;
            amount: number;
            walletId: string;
            reference: string | null;
            handledBy: string | null;
        };
    }>;
    manualResolveDeposit(tenantId: string, userId: string, dto: ManualResolveDepositDto): Promise<{
        method: string;
        type: string;
        id: string;
        status: string;
        createdAt: Date;
        description: string | null;
        amount: number;
        walletId: string;
        reference: string | null;
        handledBy: string | null;
    }>;
    makePayment(tenantId: string, userId: string, dto: CreatePaymentDto): Promise<{
        method: string;
        type: string;
        id: string;
        status: string;
        createdAt: Date;
        description: string | null;
        amount: number;
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
