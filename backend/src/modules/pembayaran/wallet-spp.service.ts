import {
  Injectable,
  Logger,
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { AuditLogService } from '../audit-log/audit-log.service';
import { TopUpDto } from './dto/topup.dto';
import { Decimal } from '@prisma/client/runtime/library';

@Injectable()
export class WalletSppService {
  private readonly logger = new Logger(WalletSppService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly auditLog: AuditLogService,
  ) {}

  /**
   * Dapatkan atau buat wallet untuk santri.
   */
  async getOrCreateWallet(tenantId: string, santriId: string) {
    let wallet = await this.prisma.wallet.findUnique({
      where: { santriId },
      include: {
        transactions: {
          orderBy: { serverTimestamp: 'desc' },
          take: 20,
          select: {
            id: true,
            tipe: true,
            jumlah: true,
            saldoSebelum: true,
            saldoSesudah: true,
            keterangan: true,
            serverTimestamp: true,
            createdBy: true,
          },
        },
      },
    });

    if (!wallet) {
      const santri = await this.prisma.santri.findFirst({
        where: { id: santriId, tenantId, deletedAt: null },
      });
      if (!santri) throw new NotFoundException('Santri tidak ditemukan');

      wallet = await this.prisma.wallet.create({
        data: { tenantId, santriId, saldo: 0, balance: 0 },
        include: { transactions: true },
      });
    }

    return wallet;
  }

  /**
   * Top-up saldo santri secara atomik.
   * Gunakan database transaction untuk atomicity — Requirement 12.2
   */
  async topUp(tenantId: string, dto: TopUpDto, userId: string) {
    if (dto.jumlah <= 0) {
      throw new UnprocessableEntityException('Jumlah top-up harus lebih dari 0');
    }

    return this.prisma.$transaction(async (tx) => {
      // Get wallet (create if not exists)
      let wallet = await tx.wallet.findUnique({ where: { santriId: dto.santriId } });

      if (!wallet) {
        const santri = await tx.santri.findFirst({
          where: { id: dto.santriId, tenantId, deletedAt: null },
        });
        if (!santri) throw new NotFoundException('Santri tidak ditemukan');

        wallet = await tx.wallet.create({
          data: { tenantId, santriId: dto.santriId, saldo: 0, balance: 0 },
        });
      }

      const saldoSebelum = wallet.saldo as Decimal;
      const jumlah = new Decimal(dto.jumlah);
      const saldoSesudah = saldoSebelum.add(jumlah);

      // Update saldo atomically
      const updatedWallet = await tx.wallet.update({
        where: { id: wallet.id },
        data: {
          saldo: saldoSesudah,
          balance: Number(saldoSesudah),
          updatedAt: new Date(),
        },
      });

      // Insert wallet_transaction bersamaan — Requirement 12.2
      const trx = await tx.walletTransaction.create({
        data: {
          walletId: wallet.id,
          tipe: 'TOPUP',
          jumlah,
          saldoSebelum,
          saldoSesudah,
          keterangan: dto.keterangan ?? 'Top-up saldo',
          serverTimestamp: new Date(),
          createdBy: userId,
          // Legacy fields
          amount: dto.jumlah,
          type: 'TOPUP',
          method: dto.metode ?? 'MANUAL',
          description: dto.keterangan ?? 'Top-up saldo',
          status: 'SUCCESS',
          handledBy: userId,
        },
      });

      // Audit log — Requirement 12.2
      await this.auditLog.log({
        userId,
        aksi: 'WALLET_TOPUP',
        modul: 'wallet',
        entitasId: wallet.id,
        entitasTipe: 'Wallet',
        nilaiBefore: { saldo: Number(saldoSebelum) },
        nilaiAfter: { saldo: Number(saldoSesudah), jumlah: dto.jumlah },
      });

      return {
        walletId: wallet.id,
        santriId: dto.santriId,
        saldoSebelum: Number(saldoSebelum),
        saldoSesudah: Number(saldoSesudah),
        jumlah: dto.jumlah,
        transactionId: trx.id,
      };
    });
  }

  /**
   * Debit saldo santri secara atomik.
   * Tolak jika saldo tidak cukup (HTTP 422) — Requirement 13.3
   */
  async debit(
    tenantId: string,
    santriId: string,
    jumlah: number,
    keterangan: string,
    userId: string,
    referensiId?: string,
  ) {
    if (jumlah <= 0) {
      throw new UnprocessableEntityException('Jumlah debit harus lebih dari 0');
    }

    return this.prisma.$transaction(async (tx) => {
      const wallet = await tx.wallet.findUnique({ where: { santriId } });

      if (!wallet || wallet.tenantId !== tenantId) {
        throw new NotFoundException('Wallet santri tidak ditemukan');
      }

      const saldoSebelum = wallet.saldo as Decimal;
      const jumlahDecimal = new Decimal(jumlah);

      // Tolak debit jika saldo tidak cukup — Requirement 13.3
      if (saldoSebelum.lessThan(jumlahDecimal)) {
        throw new UnprocessableEntityException(
          `Saldo tidak mencukupi. Saldo saat ini: ${Number(saldoSebelum)}, dibutuhkan: ${jumlah}`,
        );
      }

      const saldoSesudah = saldoSebelum.sub(jumlahDecimal);

      const updatedWallet = await tx.wallet.update({
        where: { id: wallet.id },
        data: {
          saldo: saldoSesudah,
          balance: Number(saldoSesudah),
          updatedAt: new Date(),
        },
      });

      const trx = await tx.walletTransaction.create({
        data: {
          walletId: wallet.id,
          tipe: 'DEBIT',
          jumlah: jumlahDecimal,
          saldoSebelum,
          saldoSesudah,
          referensiId,
          keterangan,
          serverTimestamp: new Date(),
          createdBy: userId,
          // Legacy fields
          amount: jumlah,
          type: 'DEBIT',
          method: 'SYSTEM',
          description: keterangan,
          status: 'SUCCESS',
          handledBy: userId,
        },
      });

      await this.auditLog.log({
        userId,
        aksi: 'WALLET_DEBIT',
        modul: 'wallet',
        entitasId: wallet.id,
        entitasTipe: 'Wallet',
        nilaiBefore: { saldo: Number(saldoSebelum) },
        nilaiAfter: { saldo: Number(saldoSesudah), jumlah },
      });

      return {
        walletId: wallet.id,
        saldoSebelum: Number(saldoSebelum),
        saldoSesudah: Number(saldoSesudah),
        jumlah,
        transactionId: trx.id,
      };
    });
  }

  /**
   * Ambil saldo dan riwayat transaksi wallet santri.
   */
  async getWalletBySantri(tenantId: string, santriId: string) {
    const wallet = await this.getOrCreateWallet(tenantId, santriId);
    return {
      id: wallet.id,
      santriId: wallet.santriId,
      saldo: Number(wallet.saldo),
      isActive: wallet.isActive,
      transactions: wallet.transactions,
    };
  }
}
