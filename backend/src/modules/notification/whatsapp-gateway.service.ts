import { Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom } from 'rxjs';

@Injectable()
export class WhatsappGatewayService {
  private readonly logger = new Logger(WhatsappGatewayService.name);
  private readonly apiUrl = 'https://api.fonnte.com/send';
  private readonly apiKey: string;

  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
  ) {
    this.apiKey = this.configService.get<string>('FONNTE_API_KEY') || 'mock-fonnte-key';
  }

  /**
   * Mengirim Pesan WA via Fonnte
   * @param target Nomor Telepon (Wali Santri dll) format 0812xxx atau 62812xxx
   * @param message Isi teks berjalan
   */
  async sendMessage(target: string, message: string): Promise<boolean> {
    try {
      if (this.apiKey === 'mock-fonnte-key') {
        this.logger.debug(`[MOCK MODE] Whatsapp Dikirim ke ${target}: \n${message}`);
        return true; // Berpura-pura sukses untuk mode Sandbox
      }

      const response = await firstValueFrom(
        this.httpService.post(
          this.apiUrl,
          {
            target: target,
            message: message,
            countryCode: '62', // Default Indonesia
          },
          {
            headers: {
              Authorization: this.apiKey, // Fonnte Token
            },
          },
        ),
      );

      if (response.data.status) {
        this.logger.log(`WhatsApp terkirim ke ${target}`);
        return true;
      } else {
        this.logger.warn(`Gagal kirim WA ke ${target}: ${response.data.reason}`);
        return false;
      }
    } catch (error: any) {
      this.logger.error(`Error Fonnte API Request: ${error.message}`);
      return false;
    }
  }
}
