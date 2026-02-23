import { BadRequestException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import {
  CreatePaymentDto,
  ManualResolveDepositDto,
  MootaWebhookDto,
  RequestDepositDto,
} from './dto/wallet.dto';

@Injectable()
export class WalletService {
  private readonly logger = new Logger(WalletService.name);

  constructor(private readonly prisma: PrismaService) {}

  async getWallet(tenantId: string, santriId: string) {
    let wallet = await this.prisma.wallet.findUnique({
      where: { santriId },
      include: {
        transactions: {
          orderBy: { createdAt: 'desc' },
          take: 15,
        },
      },
    });

    if (!wallet) {
      // Auto-create wallet if not exists when first accessed
      const santri = await this.prisma.santri.findFirst({
        where: { id: santriId, tenantId },
      });
      if (!santri) throw new NotFoundException('Santri not found');

      wallet = await this.prisma.wallet.create({
        data: { tenantId, santriId },
        include: { transactions: true },
      });
    }

    return wallet;
  }

  async requestDeposit(tenantId: string, dto: RequestDepositDto) {
    const wallet = await this.getWallet(tenantId, dto.santriId);

    // Generate unique code (1 to 999) for Moota Webhook compatibility
    const uniqueCode = Math.floor(Math.random() * 999) + 1;
    const finalAmount = dto.amount + uniqueCode;

    // In a highly concurrent prod system, we should verify uniqueness of `finalAmount`
    // within the un-expired 'PENDING' transactions here before saving.

    const trx = await this.prisma.walletTransaction.create({
      data: {
        walletId: wallet.id,
        amount: finalAmount,
        type: 'DEPOSIT',
        method: 'TRANSFER',
        status: 'PENDING',
        description: dto.description || `Top up via transfer bank sejumlah IDR ${finalAmount}`,
      },
    });

    return {
      message: 'Permintaan deposit sukses. Silakan transfer tepat sesuai nominal unik.',
      uniqueAmount: finalAmount,
      transaction: trx,
    };
  }

  async manualResolveDeposit(tenantId: string, userId: string, dto: ManualResolveDepositDto) {
    return this.prisma.$transaction(async (tx) => {
      const trx = await tx.walletTransaction.findUnique({
        where: { id: dto.transactionId },
        include: { wallet: true },
      });

      if (!trx || trx.wallet.tenantId !== tenantId) {
        throw new NotFoundException('Transaction not found');
      }

      if (trx.status !== 'PENDING') {
        throw new BadRequestException('Transaction is not in PENDING state');
      }

      const updatedTrx = await tx.walletTransaction.update({
        where: { id: trx.id },
        data: {
          status: 'SUCCESS',
          handledBy: userId,
        },
      });

      await tx.wallet.update({
        where: { id: trx.walletId },
        data: {
          balance: { increment: trx.amount },
        },
      });

      return updatedTrx;
    });
  }

  async makePayment(tenantId: string, cashierId: string, dto: CreatePaymentDto) {
    return this.prisma.$transaction(async (tx) => {
      const wallet = await tx.wallet.findUnique({
        where: { santriId: dto.santriId },
      });

      if (!wallet || wallet.tenantId !== tenantId) {
        throw new NotFoundException('Wallet not found for this santri');
      }
      if (!wallet.isActive) {
        throw new BadRequestException('Wallet is inactive');
      }
      if (wallet.balance < dto.amount) {
        throw new BadRequestException('Insufficient balance');
      }

      const trx = await tx.walletTransaction.create({
        data: {
          walletId: wallet.id,
          amount: dto.amount,
          type: 'PAYMENT',
          method: 'POS/CASHLESS',
          status: 'SUCCESS',
          description: dto.description,
          handledBy: cashierId,
        },
      });

      await tx.wallet.update({
        where: { id: wallet.id },
        data: { balance: { decrement: dto.amount } },
      });

      return trx;
    });
  }

  async handleMootaWebhook(tenantId: string, payload: MootaWebhookDto[]) {
    this.logger.log(`Received API Webhook from Moota with ${payload.length} mutations.`);
    const results = { success: 0, failed: 0, skipped: 0 };

    for (const mutation of payload) {
      if (mutation.type !== 'CR') {
        // CR = Credit/Uang Masuk
        results.skipped++;
        continue;
      }

      // Find pending transaction matching EXACT unique amount
      const pendingTrx = await this.prisma.walletTransaction.findFirst({
        where: {
          amount: mutation.amount,
          status: 'PENDING',
          type: 'DEPOSIT',
          wallet: { tenantId },
        },
        include: { wallet: true },
      });

      if (pendingTrx) {
        await this.prisma.$transaction(async (tx) => {
          await tx.walletTransaction.update({
            where: { id: pendingTrx.id },
            data: {
              status: 'SUCCESS',
              reference: `MOOTA-${mutation.bank_id}`,
              handledBy: 'SYSTEM_WEBHOOK_MOOTA',
            },
          });

          await tx.wallet.update({
            where: { id: pendingTrx.walletId },
            data: { balance: { increment: pendingTrx.amount } },
          });
        });
        results.success++;
      } else {
        // Mutasi masuk, tapi tidak ada tiket pending yg nominalnya cocok
        this.logger.warn(`Unidentified Deposit: No pending matching amount ${mutation.amount}`);
        results.failed++;
      }
    }

    return results;
  }
}
