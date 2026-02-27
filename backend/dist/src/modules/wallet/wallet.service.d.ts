import { PrismaService } from '../../common/prisma/prisma.service';
import { CooperativeCheckoutDto, CreatePaymentDto, ManualResolveDepositDto, MootaWebhookDto, RequestDepositDto } from './dto/wallet.dto';
export declare class WalletService {
    private readonly prisma;
    private readonly logger;
    constructor(prisma: PrismaService);
    getWallet(tenantId: string, santriId: string): Promise<{
        transactions: {
            id: string;
            createdAt: Date;
            description: string | null;
            type: string;
            status: string;
            amount: number;
            walletId: string;
            method: string;
            reference: string | null;
            handledBy: string | null;
        }[];
    } & {
        id: string;
        tenantId: string;
        isActive: boolean;
        updatedAt: Date;
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
        tenantId: string;
        isActive: boolean;
        updatedAt: Date;
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
            tenantId: string;
            isActive: boolean;
            updatedAt: Date;
            santriId: string;
            balance: number;
            pin: string | null;
        };
    } & {
        id: string;
        createdAt: Date;
        description: string | null;
        type: string;
        status: string;
        amount: number;
        walletId: string;
        method: string;
        reference: string | null;
        handledBy: string | null;
    })[]>;
    requestDeposit(tenantId: string, dto: RequestDepositDto): Promise<{
        message: string;
        uniqueAmount: number;
        transaction: {
            id: string;
            createdAt: Date;
            description: string | null;
            type: string;
            status: string;
            amount: number;
            walletId: string;
            method: string;
            reference: string | null;
            handledBy: string | null;
        };
    }>;
    manualResolveDeposit(tenantId: string, userId: string, dto: ManualResolveDepositDto): Promise<{
        id: string;
        createdAt: Date;
        description: string | null;
        type: string;
        status: string;
        amount: number;
        walletId: string;
        method: string;
        reference: string | null;
        handledBy: string | null;
    }>;
    makePayment(tenantId: string, cashierId: string, dto: CreatePaymentDto): Promise<{
        id: string;
        createdAt: Date;
        description: string | null;
        type: string;
        status: string;
        amount: number;
        walletId: string;
        method: string;
        reference: string | null;
        handledBy: string | null;
    }>;
    handleMootaWebhook(tenantId: string, payload: MootaWebhookDto[]): Promise<{
        success: number;
        failed: number;
        skipped: number;
    }>;
    processCooperativeCheckout(tenantId: string, cashierId: string, dto: CooperativeCheckoutDto): Promise<{
        message: string;
        walletTransactionId: string;
        deductedAmount: number;
        sisaSaldo: number;
    }>;
}
