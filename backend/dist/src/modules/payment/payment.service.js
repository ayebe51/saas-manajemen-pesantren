`` `typescript
import { Injectable, Logger, BadRequestException, InternalServerErrorException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { EventEmitter2 } from '@nestjs/event-emitter';
import * as midtransClient from 'midtrans-client';

@Injectable()
export class PaymentService {
  private readonly logger = new Logger(PaymentService.name);
  private snapApi: any;
  private coreApi: any;

  constructor(
    private prisma: PrismaService,
    private eventEmitter: EventEmitter2
  ) {
    // Inisialisasi Midtrans Snap & Core API Clients
    // TODO: Gunakan ConfigService untuk membedakan Sandbox / Production 
    this.snapApi = new midtransClient.Snap({
      isProduction: false,
      serverKey: process.env.MIDTRANS_SERVER_KEY || 'SB-Mid-server-x1x2x3x4',
      clientKey: process.env.MIDTRANS_CLIENT_KEY || 'SB-Mid-client-y1y2y3y4'
    });
    
    this.coreApi = new midtransClient.CoreApi({
      isProduction: false,
      serverKey: process.env.MIDTRANS_SERVER_KEY || 'SB-Mid-server-x1x2x3x4',
      clientKey: process.env.MIDTRANS_CLIENT_KEY || 'SB-Mid-client-y1y2y3y4'
    });
  }

  /**
   * Menggenerasi Payment Token (Snap) untuk Top-Up
   */
  async createTopUpTransaction(tenantId: string, santriId: string, amount: number) {
    try {
      // 1. Validasi Santri & Ambil Wallet ID
      const santri = await this.prisma.santri.findFirst({
        where: { id: santriId, tenantId },
        include: { wallet: true }
      });

      if (!santri) {
        throw new BadRequestException('Data Santri tidak valid / tidak ditemukan di Database.');
      }
      if (!santri.wallet) {
         throw new BadRequestException('Santri ini belum memiliki Dompet Elektronik aktif.');
      }

      // 2. Persiapkan Data Transaksi
      // Rekam ID Order unik agar tidak duplicate (Prefix TUN = TopUp-Notes)
      const orderId = `;
TOPUP - $;
{
    santri.id;
}
-$;
{
    Date.now();
}
`;

      const transactionDetails = {
        transaction_details: {
          order_id: orderId,
          gross_amount: amount
        },
        customer_details: {
          first_name: santri.name,
          email: `;
$;
{
    santri.nisn;
}
-ikhlas.com `, // mock email
          phone: "08123456789" // TODO: Tarik dari relasi Wali
        },
        item_details: [{
           id: "TOPUP-WALLET",
           price: amount,
           quantity: 1,
           name: `;
Top;
Up;
Saldo;
Dompet;
E - Pesantren `
        }],
        custom_field1: tenantId,
        custom_field2: santri.wallet.id
      };

      // 3. Tembak ke Midtrans Snap API
      this.logger.log(`;
Meminta;
Snap;
Token;
untuk;
Order;
$;
{
    orderId;
}
`);
      const transactionToken = await this.snapApi.createTransaction(transactionDetails);
      
      // Mengembalikan response mengandung 'token' dan 'redirect_url'
      return transactionToken;

    } catch (error: any) {
      this.logger.error(`;
Failed;
to;
create;
TopUp;
Transaction: $;
{
    error.message;
}
`);
      throw new InternalServerErrorException('Gagal menghubungi Payment Gateway Server.');
    }
  }

  /**
   * Menangani notifikasi Webhook status transaksi dari Midtrans Server
   */
  async handleMidtransWebhook(notificationPayload: any) {
    try {
       const statusResponse = await this.coreApi.transaction.notification(notificationPayload);
       const orderId = statusResponse.order_id;
       const transactionStatus = statusResponse.transaction_status;
       const fraudStatus = statusResponse.fraud_status;

       const tenantId = statusResponse.custom_field1;
       const walletId = statusResponse.custom_field2;
       const grossAmount = parseInt(statusResponse.gross_amount);

       this.logger.log(`;
Menerima;
Notification;
Midtrans;
Order: $;
{
    orderId;
}
 | Status;
$;
{
    transactionStatus;
}
`);

       if (transactionStatus === 'capture' || transactionStatus === 'settlement') {
           if (fraudStatus === 'challenge') {
             this.logger.warn(`;
Challenge;
transaksi;
$;
{
    orderId;
}
tunggu;
keputusan;
manual;
fraud;
radar. `);
             return { success: true, message: 'Challenge mode received' };
           }

           // UANG MASUK VALiD!
           // Proses Atomic Prisma: Eksekusi penambahan saldo Dompet santri
           await this.prisma.$transaction(async (prisma) => {
               // A. Cek agar tidak merekam orderID yg sama dua kali
               const existingTx = await prisma.walletTransaction.findFirst({
                 where: { reference: orderId }
               });

               if (existingTx && existingTx.status === 'SUCCESS') {
                  return; // Sudah pernah dikerjakan oleh notifikasi ganda. Abaikan.
               }

               // B. Buat riwayat Mutasi TopUp
               await prisma.walletTransaction.create({
                  data: {
                    walletId: walletId,
                    amount: grossAmount,
                    type: 'TOPUP',
                    status: 'SUCCESS',
                    description: `;
Top - Up;
Mandiri;
via;
Midtrans;
Payment(, { orderId }) `,
                    reference: orderId,
                    tenantId: tenantId
                  }
               });

               // C. Tambah Saldo Utama
               await prisma.wallet.update({
                  where: { id: walletId },
                  data: { balance: { increment: grossAmount } }
               });
           });
           
           this.logger.log(`;
Saldo;
$;
{
    grossAmount;
}
telah;
sukses;
masuk;
ke;
Wallet;
$;
{
    walletId;
}
!`);

           // D. Teriakkan Event agar NotificationListener mengirim kuitansi WA!
           this.eventEmitter.emit('wallet.topup.success', {
               walletId: walletId,
               amount: grossAmount,
               trxId: orderId
           });

       } else if (transactionStatus === 'cancel' || transactionStatus === 'deny' || transactionStatus === 'expire') {
           // Tansaksi Batal/Kadaluarsa. Catat sbg fail di DB jika perlu.
           this.logger.log(`;
Transaksi;
$;
{
    orderId;
}
gagal / batal($, { transactionStatus }).Tidak;
memotong / menambah;
saldo;
apapun. `);
       }

       return { success: true, message: 'Webhook Processed' };

    } catch (e: any) {
        this.logger.error(`;
Error;
Handle;
Midtrans;
Webhook: $;
{
    e.message;
}
`);
        throw new InternalServerErrorException('Failed Webhook Processing');
    }
  }
}
;
//# sourceMappingURL=payment.service.js.map