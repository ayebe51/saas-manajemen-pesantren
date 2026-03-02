import { CooperativeCheckoutDto, CreatePaymentDto, ManualResolveDepositDto, MootaWebhookDto, RequestDepositDto } from './dto/wallet.dto';
import { WalletService } from './wallet.service';
export declare class WalletController {
    private readonly walletService;
    constructor(walletService: WalletService);
    getWallet(tenantId: string, santriId: string): Promise<{
        transactions: {
            id: string;
            status: string;
            createdAt: Date;
            type: string;
            description: string | null;
            amount: number;
            method: string;
            reference: string | null;
            handledBy: string | null;
            walletId: string;
        }[];
    } & {
        id: string;
        updatedAt: Date;
        isActive: boolean;
        tenantId: string;
        santriId: string;
        balance: number;
        pin: string | null;
    }>;
    getAllWallets(tenantId: string): Promise<({
        santri: {
            name: string;
            nisn: string | null;
        };
    } & {
        id: string;
        updatedAt: Date;
        isActive: boolean;
        tenantId: string;
        santriId: string;
        balance: number;
        pin: string | null;
    })[]>;
    getAllTransactions(tenantId: string): Promise<({
        wallet: {
            santri: {
                name: string;
            };
        } & {
            id: string;
            updatedAt: Date;
            isActive: boolean;
            tenantId: string;
            santriId: string;
            balance: number;
            pin: string | null;
        };
    } & {
        id: string;
        status: string;
        createdAt: Date;
        type: string;
        description: string | null;
        amount: number;
        method: string;
        reference: string | null;
        handledBy: string | null;
        walletId: string;
    })[]>;
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
            reference: string | null;
            handledBy: string | null;
            walletId: string;
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
        reference: string | null;
        handledBy: string | null;
        walletId: string;
    }>;
    makePayment(tenantId: string, userId: string, dto: CreatePaymentDto): Promise<{
        id: string;
        status: string;
        createdAt: Date;
        type: string;
        description: string | null;
        amount: number;
        method: string;
        reference: string | null;
        handledBy: string | null;
        walletId: string;
    }>;
    processCooperativeCheckout(tenantId: string, userId: string, dto: CooperativeCheckoutDto): Promise<{
        message: string;
        walletTransactionId: string;
        deductedAmount: number;
        sisaSaldo: number;
    }>;
    handleMootaWebhook(tenantId: string, payload: MootaWebhookDto[]): Promise<{
        success: number;
        failed: number;
        skipped: number;
    }>;
}
