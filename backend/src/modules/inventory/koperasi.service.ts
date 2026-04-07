import { HttpException, HttpStatus, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { CreateKoperasiItemDto, UpdateKoperasiItemDto } from './dto/koperasi.dto';
import { Decimal } from '@prisma/client/runtime/library';

@Injectable()
export class KoperasiService {
  constructor(private readonly prisma: PrismaService) {}

  // ─── Item CRUD ──────────────────────────────────────────────────────────────

  async createItem(dto: CreateKoperasiItemDto) {
    return this.prisma.koperasiItem.create({
      data: {
        nama: dto.nama,
        harga: dto.harga,
        stok: dto.stok ?? 0,
        kategori: dto.kategori,
      },
    });
  }

  async findAllItems() {
    return this.prisma.koperasiItem.findMany({
      where: { isActive: true },
      orderBy: { nama: 'asc' },
    });
  }

  async findItemById(id: string) {
    const item = await this.prisma.koperasiItem.findUnique({ where: { id } });
    if (!item) throw new NotFoundException('Item koperasi tidak ditemukan');
    return item;
  }

  async updateItem(id: string, dto: UpdateKoperasiItemDto) {
    await this.findItemById(id);
    return this.prisma.koperasiItem.update({
      where: { id },
      data: {
        ...(dto.nama !== undefined && { nama: dto.nama }),
        ...(dto.harga !== undefined && { harga: dto.harga }),
        ...(dto.stok !== undefined && { stok: dto.stok }),
        ...(dto.kategori !== undefined && { kategori: dto.kategori }),
        ...(dto.isActive !== undefined && { isActive: dto.isActive }),
      },
    });
  }

  async deactivateItem(id: string) {
    await this.findItemById(id);
    return this.prisma.koperasiItem.update({
      where: { id },
      data: { isActive: false },
    });
  }

  // ─── Purchase Transaction ───────────────────────────────────────────────────

  /**
   * Atomically:
   * 1. Lock wallet row (SELECT FOR UPDATE)
   * 2. Check stok >= jumlah
   * 3. Check wallet saldo >= total
   * 4. Debit wallet (update saldo + insert wallet_transaction)
   * 5. Decrement koperasi_item.stok
   * 6. Insert koperasi_transaksi
   */
  async purchase(santriId: string, itemId: string, jumlah: number, createdBy?: string) {
    return this.prisma.$transaction(async (tx) => {
      // 1. Lock wallet row for this santri
      const walletRows = await tx.$queryRaw<
        Array<{
          id: string;
          saldo: Decimal;
          balance: number;
          isActive: boolean;
          tenantId: string;
        }>
      >`SELECT id, saldo, balance, "isActive", "tenantId" FROM wallets WHERE "santriId" = ${santriId} FOR UPDATE`;

      if (!walletRows || walletRows.length === 0) {
        throw new HttpException('Wallet santri tidak ditemukan', HttpStatus.UNPROCESSABLE_ENTITY);
      }
      const wallet = walletRows[0];

      // 2. Check stok
      const item = await tx.koperasiItem.findUnique({ where: { id: itemId } });
      if (!item || !item.isActive) {
        throw new NotFoundException('Item koperasi tidak ditemukan atau tidak aktif');
      }
      if (item.stok < jumlah) {
        throw new HttpException('Stok item tidak mencukupi', HttpStatus.UNPROCESSABLE_ENTITY);
      }

      // 3. Calculate total and check saldo
      const hargaSatuan = item.harga;
      const total = new Decimal(hargaSatuan).mul(jumlah);
      const saldoDecimal = new Decimal(wallet.saldo);

      if (saldoDecimal.lessThan(total)) {
        throw new HttpException('Saldo tidak mencukupi', HttpStatus.UNPROCESSABLE_ENTITY);
      }

      const saldoSebelum = saldoDecimal;
      const saldoSesudah = saldoDecimal.sub(total);

      // 4. Debit wallet — update saldo
      await tx.wallet.update({
        where: { id: wallet.id },
        data: {
          saldo: { decrement: total },
          balance: { decrement: total.toNumber() },
        },
      });

      // 5. Insert wallet_transaction record
      const walletTrx = await tx.walletTransaction.create({
        data: {
          walletId: wallet.id,
          tipe: 'DEBIT',
          type: 'PAYMENT',
          jumlah: total,
          amount: total.toNumber(),
          saldoSebelum,
          saldoSesudah,
          method: 'KOPERASI',
          status: 'SUCCESS',
          keterangan: `Pembelian koperasi: ${item.nama} x${jumlah}`,
          description: `Pembelian koperasi: ${item.nama} x${jumlah}`,
          referensiId: itemId,
          createdBy: createdBy ?? null,
        },
      });

      // 6. Decrement stok
      await tx.koperasiItem.update({
        where: { id: itemId },
        data: { stok: { decrement: jumlah } },
      });

      // 7. Insert koperasi_transaksi
      const koperasiTrx = await tx.koperasiTransaksi.create({
        data: {
          santriId,
          itemId,
          jumlah,
          hargaSatuan,
          total,
          walletTransactionId: walletTrx.id,
          createdBy: createdBy ?? null,
        },
        include: {
          item: true,
          santri: { select: { id: true, name: true, nis: true } },
        },
      });

      return koperasiTrx;
    });
  }

  // ─── Transaction Queries ────────────────────────────────────────────────────

  async findAllTransactions() {
    return this.prisma.koperasiTransaksi.findMany({
      orderBy: { serverTimestamp: 'desc' },
      include: {
        item: { select: { id: true, nama: true, kategori: true } },
        santri: { select: { id: true, name: true, nis: true } },
      },
    });
  }

  async findTransaksiBySantri(santriId: string) {
    return this.prisma.koperasiTransaksi.findMany({
      where: { santriId },
      orderBy: { serverTimestamp: 'desc' },
      include: {
        item: { select: { id: true, nama: true, kategori: true } },
      },
    });
  }
}
