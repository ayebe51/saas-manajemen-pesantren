import { Injectable, Logger, OnModuleInit, OnModuleDestroy, Inject } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../common/prisma/prisma.service';
import { TemplateEngine } from './template.engine';
import { WaProviderAdapter, WA_PROVIDER_ADAPTER } from './provider/wa-provider.interface';

const MAX_RETRY = 5;
const BASE_DELAY_SECONDS = 60; // 1 menit base delay
const POLL_INTERVAL_MS = 5_000; // poll setiap 5 detik
const BATCH_SIZE = 10;

/**
 * WaWorker — background worker yang memproses antrian WA.
 * Poll pesan PENDING/RETRYING dari wa_queue, kirim via ProviderAdapter.
 * Exponential backoff + jitter 10% untuk retry.
 * Setelah 5 kali gagal: pindahkan ke DLQ.
 * Requirements: 18.2, 18.3
 */
@Injectable()
export class WaWorkerService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(WaWorkerService.name);
  private pollTimer: NodeJS.Timeout | null = null;
  private isRunning = false;

  constructor(
    private readonly prisma: PrismaService,
    private readonly templateEngine: TemplateEngine,
    @Inject(WA_PROVIDER_ADAPTER) private readonly provider: WaProviderAdapter,
    private readonly config: ConfigService,
  ) {}

  onModuleInit(): void {
    // Mulai polling saat modul diinisialisasi
    this.startPolling();
  }

  onModuleDestroy(): void {
    this.stopPolling();
  }

  startPolling(): void {
    if (this.pollTimer) return;
    this.logger.log('[WaWorker] Starting polling...');
    this.pollTimer = setInterval(() => {
      void this.processBatch();
    }, POLL_INTERVAL_MS);
  }

  stopPolling(): void {
    if (this.pollTimer) {
      clearInterval(this.pollTimer);
      this.pollTimer = null;
      this.logger.log('[WaWorker] Polling stopped.');
    }
  }

  /**
   * Proses batch pesan PENDING/RETRYING yang sudah waktunya dikirim.
   */
  async processBatch(): Promise<void> {
    if (this.isRunning) return; // hindari concurrent processing
    this.isRunning = true;

    try {
      const now = new Date();
      const messages = await this.prisma.waQueue.findMany({
        where: {
          status: { in: ['PENDING', 'RETRYING'] },
          OR: [
            { nextRetryAt: null },
            { nextRetryAt: { lte: now } },
          ],
        },
        orderBy: { createdAt: 'asc' },
        take: BATCH_SIZE,
      });

      for (const msg of messages) {
        await this.processMessage(msg);
      }
    } catch (err: unknown) {
      const error = err as Error;
      this.logger.error(`[WaWorker] Batch processing error: ${error.message}`);
    } finally {
      this.isRunning = false;
    }
  }

  /**
   * Proses satu pesan dari queue.
   */
  async processMessage(msg: {
    id: string;
    templateKey: string;
    noTujuan: string;
    payload: unknown;
    retryCount: number;
  }): Promise<void> {
    try {
      // Render template
      const variables = msg.payload as Record<string, string | number>;
      const renderedMessage = await this.templateEngine.render(
        msg.templateKey,
        variables,
      );

      // Kirim via provider
      await this.provider.send(msg.noTujuan, renderedMessage);

      // Update status ke SENT
      await this.prisma.waQueue.update({
        where: { id: msg.id },
        data: {
          status: 'SENT',
          sentAt: new Date(),
          errorMessage: null,
        },
      });

      this.logger.log(`[WaWorker] Message ${msg.id} SENT successfully`);
    } catch (err: unknown) {
      const error = err as Error;
      await this.handleFailure(msg, error.message);
    }
  }

  /**
   * Tangani kegagalan pengiriman: retry dengan exponential backoff atau DLQ.
   */
  private async handleFailure(
    msg: { id: string; retryCount: number },
    errorMessage: string,
  ): Promise<void> {
    const newRetryCount = msg.retryCount + 1;

    if (newRetryCount >= MAX_RETRY) {
      // Pindahkan ke DLQ setelah 5 kali gagal
      await this.prisma.waQueue.update({
        where: { id: msg.id },
        data: {
          status: 'DLQ',
          retryCount: newRetryCount,
          errorMessage: `Max retry reached. Last error: ${errorMessage}`,
        },
      });
      this.logger.warn(`[WaWorker] Message ${msg.id} moved to DLQ after ${newRetryCount} attempts`);
    } else {
      // Jadwalkan retry dengan exponential backoff
      const nextRetryAt = calculateNextRetry(newRetryCount);
      await this.prisma.waQueue.update({
        where: { id: msg.id },
        data: {
          status: 'RETRYING',
          retryCount: newRetryCount,
          nextRetryAt,
          errorMessage,
        },
      });
      this.logger.warn(
        `[WaWorker] Message ${msg.id} scheduled for retry #${newRetryCount} at ${nextRetryAt.toISOString()}`,
      );
    }
  }
}

/**
 * Hitung waktu retry berikutnya dengan exponential backoff + jitter 10%.
 * Formula: delay = baseDelay * 2^(retryCount-1) + jitter(10%)
 * Percobaan ke-1: ~60s, ke-2: ~120s, ke-3: ~240s, ke-4: ~480s, ke-5: ~960s
 * Requirements: 18.2
 */
export function calculateNextRetry(retryCount: number): Date {
  // retryCount dimulai dari 1 setelah kegagalan pertama
  // delay = 60 * 2^(retryCount-1) detik
  const baseDelaySeconds = BASE_DELAY_SECONDS * Math.pow(2, retryCount - 1);
  // Jitter ±10%: random antara -10% dan +10%
  const jitterFraction = (Math.random() * 2 - 1) * 0.1;
  const delaySeconds = baseDelaySeconds * (1 + jitterFraction);
  return new Date(Date.now() + delaySeconds * 1000);
}
