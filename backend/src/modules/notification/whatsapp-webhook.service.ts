import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { ExternalNotificationService } from '../external-notification/external-notification.service';

@Injectable()
export class WhatsappWebhookService {
  private readonly logger = new Logger(WhatsappWebhookService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly extNotificationService: ExternalNotificationService,
  ) {}

  /**
   * Main handler for INCOMING WhatsApp Messages from Webhook Provider
   */
  async handleIncomingMessage(payload: any): Promise<void> {
    this.logger.log(`Received WA Webhook: ${JSON.stringify(payload)}`);
    
    // Asumsi Payload Fonnte standard (Disesuaikan jika provider berbeda spt Walo/Wablas)
    const sender = payload.sender; // Nomor pengirim
    const message = payload.message?.trim().toUpperCase(); // Isi pesan

    if (!sender || !message) return;

    this.logger.log(`Processing WA message from ${sender}: "${message}"`);

    // --- FITUR AUTO-REPLY / BOT SEDERHANA ---
    
    // 1. Cek User/Santri berdasarkan nomor WA (Bisa dari tabel Wali atau User)
    const wali = await this.prisma.wali.findFirst({
        where: { phone: { contains: sender } },
        include: { santris: { include: { santri: { include: { wallet: true } } } } }
    });

    if (message === 'PING') {
        await this.extNotificationService.sendWhatsApp(sender, 'PONG! Sistem APSS Pesantren terhubung. ✅');
        return;
    }

    if (!wali) {
        // Abaikan atau kirim balasan tidak dikenali jika format tertentu
        if (message.startsWith('INFO') || message.startsWith('SALDO')) {
           await this.extNotificationService.sendWhatsApp(sender, 'Maaf, nomor Anda belum terdaftar di sistem Pesantren kami.');
        }
        return;
    }

    // 2. Parser Command Spesifik
    if (message === 'INFO') {
        const santriNames = wali.santris.map((s: any) => s.santri.name).join(', ');
        await this.extNotificationService.sendWhatsApp(sender, `Halo Bpk/Ibu ${wali.name}, Anda terdaftar sebagai Wali dari: ${santriNames}. Ketik SALDO untuk info uang saku.`);
        return;
    }

    if (message === 'SALDO') {
        let replyMsg = `Hi ${wali.name}, berikut info Saldo Dompet Santri Anda:\n`;
        wali.santris.forEach((s: any) => {
            const wallet = s.santri.wallet as any;
            const balance = wallet?.balance || 0;
            replyMsg += `- ${s.santri.name}: Rp ${balance.toLocaleString('id-ID')}\n`;
        });
        await this.extNotificationService.sendWhatsApp(sender, replyMsg);
        return;
    }

    // Default Fallback
    await this.extNotificationService.sendWhatsApp(sender, 'Perintah tidak dikenali. Ketik INFO untuk bantuan.');
  }
}
