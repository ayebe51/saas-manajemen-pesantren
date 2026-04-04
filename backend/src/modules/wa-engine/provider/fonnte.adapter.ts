import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import { WaProviderAdapter, WaMessageStatus } from './wa-provider.interface';

/**
 * FonnteAdapter — implementasi konkret untuk gateway Fonnte.
 * Dikonfigurasi via env: WA_PROVIDER=fonnte, FONNTE_TOKEN
 * Requirements: 18.6, 18.7
 */
@Injectable()
export class FonnteAdapter implements WaProviderAdapter {
  private readonly logger = new Logger(FonnteAdapter.name);
  private readonly baseUrl = 'https://api.fonnte.com';
  private readonly token: string;

  constructor(private readonly config: ConfigService) {
    this.token = this.config.get<string>('FONNTE_TOKEN') ?? '';
  }

  async send(to: string, message: string): Promise<{ messageId: string }> {
    if (!this.token) {
      // Dev mode: log ke console, tidak kirim ke provider
      this.logger.debug(`[Fonnte Mock] To: ${to} | Msg: ${message.slice(0, 50)}...`);
      return { messageId: `mock-${Date.now()}` };
    }

    const response = await axios.post(
      `${this.baseUrl}/send`,
      {
        target: to,
        message,
        typing: false,
        delay: '1',
      },
      {
        headers: { Authorization: this.token },
        timeout: 10_000,
      },
    );

    const messageId: string =
      (response.data as { id?: string })?.id ?? `fonnte-${Date.now()}`;
    this.logger.log(`[Fonnte] Sent to ${to}, messageId=${messageId}`);
    return { messageId };
  }

  async getStatus(messageId: string): Promise<WaMessageStatus> {
    if (!this.token) {
      return 'sent';
    }

    try {
      const response = await axios.get(`${this.baseUrl}/status`, {
        params: { id: messageId },
        headers: { Authorization: this.token },
        timeout: 5_000,
      });
      const status = (response.data as { status?: string })?.status ?? 'pending';
      return this.mapStatus(status);
    } catch {
      return 'pending';
    }
  }

  private mapStatus(raw: string): WaMessageStatus {
    const map: Record<string, WaMessageStatus> = {
      sent: 'sent',
      delivered: 'delivered',
      read: 'read',
      failed: 'failed',
      pending: 'pending',
    };
    return map[raw.toLowerCase()] ?? 'pending';
  }
}
