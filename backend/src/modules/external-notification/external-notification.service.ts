import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class ExternalNotificationService {
  private readonly logger = new Logger(ExternalNotificationService.name);

  constructor(private configService: ConfigService) {}

  /**
   * Mock implementation of sending WhatsApp message (e.g., via Twilio/Wablas)
   */
  async sendWhatsApp(to: string, message: string): Promise<boolean> {
    this.logger.log(`[WA Mock] Sending message to ${to}:\n${message}`);
    
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 300));
    
    // Normally you'd call an external API here
    const twilioSid = this.configService.get<string>('TWILIO_ACCOUNT_SID');
    if (twilioSid) {
       this.logger.debug(`[WA Mock] Twilio SID configured: ${twilioSid}`);
    }

    return true;
  }

  /**
   * Mock implementation of sending Email (e.g., via SendGrid/AWS SES)
   */
  async sendEmail(to: string, subject: string, body: string): Promise<boolean> {
    this.logger.log(`[Email Mock] Sending email to ${to}\nSubject: ${subject}\nBody: ${body}`);
    
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 300));

    return true;
  }
}
