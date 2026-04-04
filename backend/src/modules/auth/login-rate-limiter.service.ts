import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';

/**
 * LoginRateLimiterService
 *
 * Tracks failed login attempts per IP using Redis counters.
 * Strategy:
 *   - Key `login_attempts:{ip}` — counter with TTL 60s (1-minute window)
 *   - Key `login_lockout:{ip}` — lockout flag with TTL 900s (15 minutes)
 *
 * Requirements: 1.6, 22.7
 */
@Injectable()
export class LoginRateLimiterService {
  private readonly logger = new Logger(LoginRateLimiterService.name);
  private readonly redis: Redis;

  private readonly MAX_ATTEMPTS = 10;
  private readonly WINDOW_TTL = 60;       // seconds — 1 minute window
  private readonly LOCKOUT_TTL = 900;     // seconds — 15 minutes lockout

  constructor(private readonly configService: ConfigService) {
    this.redis = new Redis({
      host: this.configService.get<string>('REDIS_HOST') || 'localhost',
      port: this.configService.get<number>('REDIS_PORT') || 6379,
      password: this.configService.get<string>('REDIS_PASSWORD') || undefined,
      lazyConnect: true,
      enableOfflineQueue: false,
    });

    this.redis.on('error', (err) => {
      this.logger.warn(`Redis connection error (rate limiter): ${err.message}`);
    });
  }

  /** Returns true if the IP is currently locked out */
  async isLockedOut(ip: string): Promise<boolean> {
    try {
      const lockout = await this.redis.get(this.lockoutKey(ip));
      return lockout !== null;
    } catch (err) {
      this.logger.warn(`Redis isLockedOut error: ${err.message}`);
      return false; // fail open — don't block on Redis failure
    }
  }

  /**
   * Records a failed attempt for the IP.
   * If the counter reaches MAX_ATTEMPTS, sets a lockout key.
   * Returns the current attempt count.
   */
  async recordFailedAttempt(ip: string): Promise<number> {
    try {
      const key = this.attemptsKey(ip);
      const count = await this.redis.incr(key);

      if (count === 1) {
        // First attempt in this window — set TTL
        await this.redis.expire(key, this.WINDOW_TTL);
      }

      if (count >= this.MAX_ATTEMPTS) {
        // Trigger lockout
        await this.redis.set(this.lockoutKey(ip), '1', 'EX', this.LOCKOUT_TTL);
        this.logger.warn(`IP ${ip} locked out after ${count} failed login attempts`);
      }

      return count;
    } catch (err) {
      this.logger.warn(`Redis recordFailedAttempt error: ${err.message}`);
      return 0;
    }
  }

  /** Resets the attempt counter for the IP (called on successful login) */
  async resetAttempts(ip: string): Promise<void> {
    try {
      await this.redis.del(this.attemptsKey(ip));
    } catch (err) {
      this.logger.warn(`Redis resetAttempts error: ${err.message}`);
    }
  }

  /** Returns remaining TTL (seconds) of the lockout, or 0 if not locked */
  async getLockoutTtl(ip: string): Promise<number> {
    try {
      const ttl = await this.redis.ttl(this.lockoutKey(ip));
      return ttl > 0 ? ttl : 0;
    } catch {
      return 0;
    }
  }

  private attemptsKey(ip: string): string {
    return `login_attempts:${ip}`;
  }

  private lockoutKey(ip: string): string {
    return `login_lockout:${ip}`;
  }
}
