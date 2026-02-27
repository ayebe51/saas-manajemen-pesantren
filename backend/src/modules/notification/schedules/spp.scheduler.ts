import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../../../common/prisma/prisma.service';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';

@Injectable()
export class SppSchedulerService {
  private readonly logger = new Logger(SppSchedulerService.name);

  constructor(
    private prisma: PrismaService,
    @InjectQueue('wa-messages') private waQueue: Queue,
  ) {}

  /**
   * Berlari setiap tanggal 7, Jam 08:00 Pagi.
   * Mengirim notifikasi SPP bulanan ke wali santri yang memiliki tunggakan/belum bayar.
   */
  // @Cron('0 8 7 * *') // Production
  @Cron(CronExpression.EVERY_DAY_AT_10AM) // Development testing: Jam 10 pagi setiap hari
  async handleSppReminderCron() {
    this.logger.log('SppScheduler: Mencari Santri yang belum lunas SPP bulan ini...');

    // Asumsi: Semua Santri yang Status SPP nya "UNPAID" pada tagihan Payment terbaru
    // Di sini kita mock logic (karena modul Invoice SPP kompleks belum dibuat penuh)
    // Kita panggil semua santri yang memiliki Wali terhubung untuk demo WhatsApp Notification

    const santriWithWali = await this.prisma.santri.findMany({
      where: {
        status: 'ACTIVE',
      },
      include: {
        walis: {
          where: { isPrimary: true },
          include: { wali: true },
        },
      },
    });

    let queueCount = 0;

    for (const data of santriWithWali) {
      const waliPrimary = data.walis[0]?.wali;
      if (waliPrimary && waliPrimary.phone) {
        const nominalSpp = 'Rp 450.000'; // Mock
        const message = `*PENGINGAT SPP PESANTREN*\n\nAssalamu'alaikum Bpk/Ibu ${waliPrimary.name}.\n\nKami mengingatkan bahwa tagihan Syahriah (SPP) Ananda *${data.name}* sebesar ${nominalSpp} untuk bulan ini akan segera jatuh tempo.\n\nMohon segera melunasi melalui VA atau fasilitas Top-Up pada Aplikasi Wali Santri.\n\nTerima Kasih.\n- Admin APSS`;

        // Masukkan ke dalan antrean BullMQ
        await this.waQueue.add('send-spp-reminder', {
          targetPhone: waliPrimary.phone,
          message: message,
        });

        queueCount++;
      }
    }

    this.logger.log(
      `SppScheduler: Sukses mendaftarkan ${queueCount} pesan tagihan SPP ke Antrean WhatsApp (BullMQ). Tunggu pengiriman...`,
    );
  }
}
