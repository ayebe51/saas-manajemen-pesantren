import { Controller, Post, Body, HttpCode, HttpStatus, Logger } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { WhatsappWebhookService } from '../notification/whatsapp-webhook.service';

@ApiTags('Public & Integrations')
@Controller('webhook')
// Catatan: Controller Webhook biasanya DIBEBASKAN dari JWT maupun API KEY
// Agar provider External (Stripe/Fonnte/Moota) bisa nge-Post data kapan saja.
export class WebhookController {
  private readonly logger = new Logger(WebhookController.name);

  constructor(private readonly waWebhookService: WhatsappWebhookService) {}

  @Post('whatsapp')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Receive Forwarded/Incoming WhatsApp Messages from Provider' })
  async receiveWhatsappMessage(@Body() payload: any) {
    this.logger.log('Incoming WhatsApp Webhook Hit');

    // Karena provider WA akan memanggil Endpoint ini, respon harus selalu cepat (200 OK)
    // agar mereka tidak menganggap timeout.
    // Pemrosesan pesan berat dilempar ke background (async)
    this.waWebhookService.handleIncomingMessage(payload).catch((err) => {
      this.logger.error(`Error processing webhook: ${err.message}`);
    });

    return { status: 'Received' };
  }
}
