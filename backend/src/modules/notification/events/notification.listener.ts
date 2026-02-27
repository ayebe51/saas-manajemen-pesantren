import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { PrismaService } from '../../../common/prisma/prisma.service';

@Injectable()
export class NotificationEventListener {
  private readonly logger = new Logger(NotificationEventListener.name);

  constructor(
    private prisma: PrismaService,
    @InjectQueue('wa-messages') private waQueue: Queue,
  ) {}

  /**
   * Listener untuk Event 'pelanggaran.created'
   */
  @OnEvent('pelanggaran.created')
  async handlePelanggaranEvent(payload: {
    santriId: string;
    ruleName: string;
    points: number;
    date: Date;
  }) {
    this.logger.log(`Event Tertangkap: Pelanggaran baru untuk Santri ID ${payload.santriId}`);

    try {
      // 1. Dapatkan Profil Anak dan Wali Utamanya
      const santri = await this.prisma.santri.findUnique({
        where: { id: payload.santriId },
        include: {
          walis: {
            where: { isPrimary: true },
            include: { wali: true },
          },
        },
      });

      if (!santri || !santri.walis.length) {
        return; // Skip jika tiada wali terhubung
      }

      const waliPhone = santri.walis[0].wali.phone;
      if (!waliPhone) return;

      const message = `*INFO KEDISIPLINAN PESANTREN*\n\nAssalamu'alaikum Bpk/Ibu.\n\nKami mengabarkan bahwa putra/putri Anda, Ananda *${santri.name}* telah tercatat melakukan pelanggaran dengan rincian:\n\n- Pelanggaran: ${payload.ruleName}\n- Poin Hukuman: ${payload.points}\n- Tanggal Kejadian: ${payload.date.toLocaleDateString('id-ID')}\n\nMohon kebijaksanaannya dalam membimbing Ananda ketika pulang/telepon.`;

      // 2. Ceburkan pesan ke dalam Antrean WA supaya aman dari Blokir
      await this.waQueue.add('send-pelanggaran-alert', {
        targetPhone: waliPhone,
        message: message,
      });
    } catch (e: any) {
      this.logger.error(`Error processing Pelanggaran WA Event: ${e.message}`);
    }
  }

  /**
   * Listener untuk Event 'wallet.topup.success'
   * Dipanggil otomatis oleh PaymentService sesaat setelah menerima sukses Webhook Midtrans
   */
  @OnEvent('wallet.topup.success')
  async handleWalletTopUpSuccess(payload: { walletId: string; amount: number; trxId: string }) {
    try {
      // Cari NISN / Data Santri Pemilik Wallet
      const dompet = await this.prisma.wallet.findUnique({
        where: { id: payload.walletId },
        include: {
          santri: {
            include: { walis: { where: { isPrimary: true }, include: { wali: true } } },
          },
        },
      });

      if (!dompet || !dompet.santri?.walis.length) return;

      const waliPhone = dompet.santri.walis[0].wali.phone;
      if (!waliPhone) return;

      const msg = `*INFO KEUANGAN PESANTREN*\n\nAlhamdulillah, Bapak/Ibu.\n\nTop-Up saldo E-Wallet atas nama Ananda *${dompet.santri.name}* sebesar *Rp ${payload.amount.toLocaleString('id-ID')}* telah SUKSES otomatis ditambahkan ke sistem oleh Payment Gateway.\n\nSaldo Akhir Ananda saat ini: *Rp ${dompet.balance.toLocaleString('id-ID')}*.\n\nTerima kasih.\n- Koperasi Baitul Mal`;

      await this.waQueue.add('send-topup-receipt', {
        targetPhone: waliPhone,
        message: msg,
      });
    } catch (e: any) {
      this.logger.error(`Error broadcast WA Receipt Topup: ${e.message}`);
    }
  }
}
