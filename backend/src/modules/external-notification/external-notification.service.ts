import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import * as admin from 'firebase-admin';

@Injectable()
export class ExternalNotificationService implements OnModuleInit {
  private readonly logger = new Logger(ExternalNotificationService.name);
  private isFirebaseInitialized = false;

  constructor(private configService: ConfigService) {}

  onModuleInit() {
    this.initializeFirebase();
  }

  private initializeFirebase() {
    try {
      // In production, you would typically use a service account JSON file
      // e.g: admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
      const projectId = this.configService.get<string>('FIREBASE_PROJECT_ID');
      const clientEmail = this.configService.get<string>('FIREBASE_CLIENT_EMAIL');
      // Private key might contain escaped newlines '\n' which need to be unescaped
      const privateKey = this.configService
        .get<string>('FIREBASE_PRIVATE_KEY')
        ?.replace(/\\n/g, '\n');

      if (projectId && clientEmail && privateKey) {
        admin.initializeApp({
          credential: admin.credential.cert({
            projectId,
            clientEmail,
            privateKey,
          }),
        });
        this.isFirebaseInitialized = true;
        this.logger.log('Firebase Admin SDK initialized successfully for Push Notifications.');
      } else {
        this.logger.warn(
          'Firebase configuration missing in .env. FCM Push Notifications will be disabled.',
        );
      }
    } catch (error) {
      this.logger.error(`Failed to initialize Firebase Admin: ${error.message}`);
    }
  }

  /**
   * Send Push Notification via Firebase Cloud Messaging (FCM)
   */
  async sendPushNotification(
    deviceTokens: string[],
    title: string,
    body: string,
    data?: any,
  ): Promise<boolean> {
    if (!this.isFirebaseInitialized) {
      this.logger.debug(
        `[FCM Mock Output] To: ${deviceTokens.length} devices | Title: ${title} | Body: ${body}`,
      );
      return true;
    }

    if (!deviceTokens || deviceTokens.length === 0) return false;

    try {
      const message: admin.messaging.MulticastMessage = {
        notification: {
          title,
          body,
        },
        data: data || {},
        tokens: deviceTokens,
      };

      const response = await admin.messaging().sendEachForMulticast(message);

      this.logger.log(
        `[FCM] Sent Push Notification: ${response.successCount} successful, ${response.failureCount} failed.`,
      );

      // Handle failed tokens (e.g. cleanup old tokens from database)
      if (response.failureCount > 0) {
        const failedTokens: string[] = [];
        response.responses.forEach((resp, idx) => {
          if (!resp.success) {
            failedTokens.push(deviceTokens[idx]);
            this.logger.warn(`Failed token: ${deviceTokens[idx]} - Reason: ${resp.error?.message}`);
          }
        });
        // Note: Removing from DB should ideally be handled asynchronously in the caller or via an event.
      }

      return response.successCount > 0;
    } catch (error) {
      this.logger.error(`Failed to send push notification: ${error.message}`);
      return false;
    }
  }

  /**
   * Real implementation of sending WhatsApp message via HTTP Provider (Fonnte/Walo/Wablas)
   */
  async sendWhatsApp(to: string, message: string): Promise<boolean> {
    const waProviderUrl = this.configService.get<string>('WA_PROVIDER_URL'); // e.g., https://api.fonnte.com/send
    const waToken = this.configService.get<string>('WA_PROVIDER_TOKEN');

    if (!waProviderUrl || !waToken) {
      this.logger.warn(
        `[WA Missing Config] Cannot send message to ${to}. Provider URL or Token is not configured in .env`,
      );
      // Fallback to console debug if ENV is not set (Local Dev Mode)
      this.logger.debug(`[WA Local Debug Output]: To: ${to} | MSG: ${message}`);
      return true;
    }

    try {
      this.logger.log(`[WA] Sending real message to ${to} via webhook provider...`);

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

      this.logger.log(
        `[WA] Successfully sent message to ${to}. Provider response: ${JSON.stringify(response.data)}`,
      );
      return true;
    } catch (error) {
      this.logger.error(`Failed to send WhatsApp message to ${to}: ${error.message}`);
      return false;
    }
  }

  /**
   * Mock implementation of sending Email (e.g., via SendGrid/AWS SES)
   */
  async sendEmail(to: string, subject: string, body: string): Promise<boolean> {
    this.logger.log(`[Email Mock] Sending email to ${to}\nSubject: ${subject}\nBody: ${body}`);
    await new Promise((resolve) => setTimeout(resolve, 300));
    return true;
  }
}
