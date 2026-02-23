import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';

@Injectable()
export class ExternalNotificationService {
  private readonly logger = new Logger(ExternalNotificationService.name);

  constructor(private configService: ConfigService) {}

  /**
   * Real implementation of sending WhatsApp message via HTTP Provider (Fonnte/Walo/Wablas)
   */
  async sendWhatsApp(to: string, message: string): Promise<boolean> {
    const waProviderUrl = this.configService.get<string>('WA_PROVIDER_URL'); // e.g., https://api.fonnte.com/send
    const waToken = this.configService.get<string>('WA_PROVIDER_TOKEN');

    if (!waProviderUrl || !waToken) {
      this.logger.warn(\`[WA Missing Config] Cannot send message to \${to}. Provider URL or Token is not configured in .env\`);
      // Fallback to console debug if ENV is not set (Local Dev Mode)
      this.logger.debug(\`[WA Local Debug Output]: To: \${to} | MSG: \${message}\`);
      return true;
    }

    try {
      this.logger.log(\`[WA] Sending real message to \${to} via webhook provider...\`);
      
      // Standard HTTP POST Payload, adjust structure according to the specific provider (Fonnte in this example)
      const payload = {
        target: to,
        message: message,
        typing: false,
        delay: '1',
      };

      const response = await axios.post(waProviderUrl, payload, {
        headers: {
          Authorization: waToken,
        },
        timeout: 10000, // 10s timeout
      });

      this.logger.log(\`[WA] Successfully sent message to \${to}. Provider response: \${JSON.stringify(response.data)}\`);
      return true;
    } catch (error) {
      this.logger.error(\`Failed to send WhatsApp message to \${to}: \${error.message}\`);
      return false;
    }
  }

  /**
   * Mock implementation of sending Email (e.g., via SendGrid/AWS SES)
   */
  async sendEmail(to: string, subject: string, body: string): Promise<boolean> {
    this.logger.log(\`[Email Mock] Sending email to \${to}\\nSubject: \${subject}\\nBody: \${body}\`);
    await new Promise((resolve) => setTimeout(resolve, 300));
    return true;
  }
}
