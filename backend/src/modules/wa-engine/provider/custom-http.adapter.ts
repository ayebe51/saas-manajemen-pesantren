import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import { WaProviderAdapter, WaMessageStatus } from './wa-provider.interface';

/**
 * CustomHttpAdapter — implementasi generic untuk gateway WA custom.
 * Dikonfigurasi via env: WA_PROVIDER=custom, WA_PROVIDER_URL, WA_PROVIDER_TOKEN
 * Requirements: 18.6, 18.7
 */
@Injectable()
export class CustomHttpAdapter implements WaProviderAdapter {
  private readonly logger = new Logger(CustomHttpAdapter.name);
  private readonly providerUrl: string;
  private readonly token: string;

  constructor(private readonly config: ConfigService) {
    this.providerUrl = this.config.get<string>('WA_PROVIDER_URL') ?? '';
    this.token = this.config.get<string>('WA_PROVIDER_TOKEN') ?? '';
  }

  async send(to: string, message: string): Promise<{ messageId: string }> {
    if (!this.providerUrl || !this.token) {
      this.logger.debug(`[CustomHttp Mock] To: ${to} | Msg: ${message.slice(0, 50)}...`);
      return { messageId: `mock-${Date.now()}` };
    }

    const response = await axios.post(
      this.providerUrl,
      { target: to, message },
      {
        headers: { Authorization: `Bearer ${this.token}` },
        timeout: 10_000,
      },
    );

    const messageId: string =
      (response.data as { id?: string })?.id ?? `custom-${Date.now()}`;
    this.logger.log(`[CustomHttp] Sent to ${to}, messageId=${messageId}`);
    return { messageId };
  }

  async getStatus(messageId: string): Promise<WaMessageStatus> {
    return 'pending';
  }
}
