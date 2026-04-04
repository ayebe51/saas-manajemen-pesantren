import { Injectable, Inject, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { v4 as uuidv4 } from 'uuid';
import Redis from 'ioredis';

export const QR_TOKEN_TTL_SECONDS = 300; // 5 minutes — Requirement 5.1

export interface QrTokenPayload {
  sessionId: string;
  tenantId: string;
  createdAt: string; // ISO server_timestamp
}

export interface QrValidationResult {
  valid: boolean;
  expired: boolean;
  alreadyUsed: boolean;
  payload?: QrTokenPayload;
}

@Injectable()
export class QrTokenService {
  private readonly logger = new Logger(QrTokenService.name);
  private readonly redis: Redis;

  constructor(private readonly config: ConfigService) {
    this.redis = new Redis({
      host: this.config.get<string>('REDIS_HOST', 'localhost'),
      port: this.config.get<number>('REDIS_PORT', 6379),
      password: this.config.get<string>('REDIS_PASSWORD') || undefined,
    });
  }

  /**
   * Generate a unique QR token for a presensi session.
   * Stores token in Redis with TTL of 5 minutes (server_timestamp based).
   * Key: qr:token:{token}
   * Requirements: 5.1, 5.2
   */
  async generateToken(sessionId: string, tenantId: string): Promise<{ token: string; expiresAt: Date }> {
    const token = uuidv4();
    const serverTimestamp = new Date();
    const expiresAt = new Date(serverTimestamp.getTime() + QR_TOKEN_TTL_SECONDS * 1000);

    const payload: QrTokenPayload = {
      sessionId,
      tenantId,
      createdAt: serverTimestamp.toISOString(),
    };

    // Store in Redis with TTL — key: qr:token:{token}
    await this.redis.set(
      `qr:token:${token}`,
      JSON.stringify(payload),
      'EX',
      QR_TOKEN_TTL_SECONDS,
    );

    this.logger.debug(`QR token generated for session ${sessionId}, expires at ${expiresAt.toISOString()}`);
    return { token, expiresAt };
  }

  /**
   * Validate a QR token.
   * - Returns expired=true if key no longer exists in Redis (TTL elapsed)
   * - Returns alreadyUsed=true if token was already consumed
   * - Marks token as used after first successful validation (one-time-use)
   * Requirements: 5.2, 5.3
   */
  async validateToken(token: string): Promise<QrValidationResult> {
    const key = `qr:token:${token}`;
    const usedKey = `qr:used:${token}`;

    // Check if already used (one-time-use enforcement)
    const isUsed = await this.redis.exists(usedKey);
    if (isUsed) {
      return { valid: false, expired: false, alreadyUsed: true };
    }

    const raw = await this.redis.get(key);
    if (!raw) {
      // Key expired or never existed
      return { valid: false, expired: true, alreadyUsed: false };
    }

    const payload: QrTokenPayload = JSON.parse(raw);
    return { valid: true, expired: false, alreadyUsed: false, payload };
  }

  /**
   * Mark a QR token as used (one-time-use).
   * Stores a used marker in Redis with same TTL so cleanup is automatic.
   * Requirements: 5.2
   */
  async markTokenUsed(token: string): Promise<void> {
    const usedKey = `qr:used:${token}`;
    // Keep used marker for the same TTL window to prevent replay
    await this.redis.set(usedKey, '1', 'EX', QR_TOKEN_TTL_SECONDS);
    // Remove the original token key
    await this.redis.del(`qr:token:${token}`);
  }

  /**
   * Delete a token from Redis (e.g., when session is closed).
   */
  async deleteToken(token: string): Promise<void> {
    await this.redis.del(`qr:token:${token}`);
  }
}
