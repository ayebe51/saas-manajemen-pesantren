import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';

export interface EnqueueWaMessageDto {
  tipeNotifikasi: string;
  noTujuan: string;
  templateKey: string;
  payload: Record<string, string | number>;
}

/**
 * WaQueueService — enqueue pesan WhatsApp ke tabel wa_queue secara asinkron.
 * Insert tidak memblokir operasi bisnis utama (fire-and-forget pattern).
 * Requirements: 18.1
 */
@Injectable()
export class WaQueueService {
  private readonly logger = new Logger(WaQueueService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Enqueue pesan WA ke database queue.
   * Operasi ini asinkron — tidak menunggu hasil insert selesai
   * agar tidak memblokir operasi bisnis utama.
   */
  enqueue(dto: EnqueueWaMessageDto): void {
    // Fire-and-forget: tidak await, tidak memblokir caller
    this.prisma.waQueue
      .create({
        data: {
          tipeNotifikasi: dto.tipeNotifikasi,
          noTujuan: dto.noTujuan,
          templateKey: dto.templateKey,
          payload: dto.payload,
          status: 'PENDING',
          retryCount: 0,
        },
      })
      .then(() => {
        this.logger.debug(
          `[WA Queue] Enqueued ${dto.tipeNotifikasi} → ${this.maskPhone(dto.noTujuan)}`,
        );
      })
      .catch((err: Error) => {
        // Kegagalan enqueue dicatat tapi tidak menggagalkan operasi bisnis
        this.logger.error(`[WA Queue] Failed to enqueue message: ${err.message}`);
      });
  }

  /**
   * Enqueue pesan WA secara async (awaitable) — untuk kasus yang memerlukan konfirmasi insert.
   */
  async enqueueAsync(dto: EnqueueWaMessageDto): Promise<{ id: string }> {
    const record = await this.prisma.waQueue.create({
      data: {
        tipeNotifikasi: dto.tipeNotifikasi,
        noTujuan: dto.noTujuan,
        templateKey: dto.templateKey,
        payload: dto.payload,
        status: 'PENDING',
        retryCount: 0,
      },
      select: { id: true },
    });
    this.logger.debug(
      `[WA Queue] Enqueued (async) ${dto.tipeNotifikasi} → ${this.maskPhone(dto.noTujuan)} [id=${record.id}]`,
    );
    return record;
  }

  /** Samarkan nomor HP untuk audit log: 0812****5678 */
  private maskPhone(phone: string): string {
    if (phone.length <= 8) return '****';
    return phone.slice(0, 4) + '****' + phone.slice(-4);
  }
}
