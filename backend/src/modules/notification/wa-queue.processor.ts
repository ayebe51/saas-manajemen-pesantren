import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { WhatsappGatewayService } from './whatsapp-gateway.service';

@Processor('wa-messages')
export class WaQueueProcessor extends WorkerHost {
  private readonly logger = new Logger(WaQueueProcessor.name);

  constructor(private readonly waGateway: WhatsappGatewayService) {
    super();
  }

  async process(job: Job<any, any, string>): Promise<any> {
    this.logger.debug(`Memproses Antrean Pesan WA untuk Job ID: ${job.id}`);

    const { targetPhone, message } = job.data;

    // Melakukan Delay buatan antar request Fonnte agar aman dari blokir (Rate-Limiting)
    // Walaupun Redis sangat cepat, layanan third-party sering menerapkan threshold.
    await new Promise((resolve) => setTimeout(resolve, 1500));

    const result = await this.waGateway.sendMessage(targetPhone, message);

    if (!result) {
      this.logger.error(`Whatsapp pengingat SPP gagal dikirim ke ${targetPhone}`);
      // Tergantung requirement, kita bisa throw Error di sini agar Job retry di BullMQ
    }

    return result;
  }
}
