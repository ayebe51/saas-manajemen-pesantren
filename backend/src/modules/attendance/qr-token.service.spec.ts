// Feature: pesantren-management-app, Property 11: QR Token Idempotency dan One-Time-Use
import * as fc from 'fast-check';
import { QrTokenService, QR_TOKEN_TTL_SECONDS } from './qr-token.service';
import { ConfigService } from '@nestjs/config';

// ─── Mock Redis ────────────────────────────────────────────────────────────────
class MockRedis {
  private store = new Map<string, { value: string; expiresAt: number }>();

  async set(key: string, value: string, mode?: string, ttl?: number): Promise<void> {
    const expiresAt = ttl ? Date.now() + ttl * 1000 : Infinity;
    this.store.set(key, { value, expiresAt });
  }

  async get(key: string): Promise<string | null> {
    const entry = this.store.get(key);
    if (!entry) return null;
    if (Date.now() > entry.expiresAt) {
      this.store.delete(key);
      return null;
    }
    return entry.value;
  }

  async exists(key: string): Promise<number> {
    const entry = this.store.get(key);
    if (!entry) return 0;
    if (Date.now() > entry.expiresAt) {
      this.store.delete(key);
      return 0;
    }
    return 1;
  }

  async del(key: string): Promise<number> {
    return this.store.delete(key) ? 1 : 0;
  }

  clear() {
    this.store.clear();
  }
}

// ─── Test Setup ────────────────────────────────────────────────────────────────
function createService(): { service: QrTokenService; redis: MockRedis } {
  const redis = new MockRedis();
  const config = { get: jest.fn().mockReturnValue(undefined) } as unknown as ConfigService;
  const service = new QrTokenService(config);
  // Disconnect the real Redis connection created in constructor, then inject mock
  const realRedis = (service as any).redis;
  if (realRedis && typeof realRedis.disconnect === 'function') {
    realRedis.disconnect();
  }
  (service as any).redis = redis;
  return { service, redis };
}

// ─── Unit Tests ────────────────────────────────────────────────────────────────
describe('QrTokenService — Unit Tests', () => {
  let service: QrTokenService;
  let redis: MockRedis;

  beforeEach(() => {
    ({ service, redis } = createService());
  });

  afterEach(() => {
    redis.clear();
  });

  it('should generate a unique token with correct TTL', async () => {
    const before = new Date();
    const { token, expiresAt } = await service.generateToken('session-1', 'tenant-1');

    expect(token).toBeTruthy();
    expect(typeof token).toBe('string');
    expect(expiresAt.getTime()).toBeGreaterThan(before.getTime());
    // expiresAt should be ~5 minutes from now
    const diffSeconds = (expiresAt.getTime() - before.getTime()) / 1000;
    expect(diffSeconds).toBeGreaterThanOrEqual(QR_TOKEN_TTL_SECONDS - 1);
    expect(diffSeconds).toBeLessThanOrEqual(QR_TOKEN_TTL_SECONDS + 1);
  });

  it('should validate a fresh token successfully', async () => {
    const { token } = await service.generateToken('session-1', 'tenant-1');
    const result = await service.validateToken(token);

    expect(result.valid).toBe(true);
    expect(result.expired).toBe(false);
    expect(result.alreadyUsed).toBe(false);
    expect(result.payload?.sessionId).toBe('session-1');
    expect(result.payload?.tenantId).toBe('tenant-1');
  });

  it('should return expired=true for unknown/expired token', async () => {
    const result = await service.validateToken('non-existent-token');

    expect(result.valid).toBe(false);
    expect(result.expired).toBe(true);
    expect(result.alreadyUsed).toBe(false);
  });

  it('should return alreadyUsed=true after markTokenUsed', async () => {
    const { token } = await service.generateToken('session-1', 'tenant-1');
    await service.markTokenUsed(token);

    const result = await service.validateToken(token);
    expect(result.valid).toBe(false);
    expect(result.alreadyUsed).toBe(true);
    expect(result.expired).toBe(false);
  });

  it('should delete token from Redis after markTokenUsed', async () => {
    const { token } = await service.generateToken('session-1', 'tenant-1');
    await service.markTokenUsed(token);

    // Original key should be gone
    const raw = await (redis as any).get(`qr:token:${token}`);
    expect(raw).toBeNull();
  });
});

// ─── Property Tests ────────────────────────────────────────────────────────────
describe('QrTokenService — Property 11: QR Token Idempotency dan One-Time-Use', () => {
  let service: QrTokenService;
  let redis: MockRedis;

  beforeEach(() => {
    ({ service, redis } = createService());
  });

  afterEach(() => {
    redis.clear();
  });

  /**
   * Property 11a: Setiap token yang di-generate harus unik
   * Validates: Requirements 5.1
   */
  it('Property 11a: Token yang di-generate selalu unik', async () => {
    // Feature: pesantren-management-app, Property 11: QR Token Idempotency dan One-Time-Use
    await fc.assert(
      fc.asyncProperty(
        fc.uuid(),
        fc.uuid(),
        async (sessionId, tenantId) => {
          redis.clear();
          const { token: t1 } = await service.generateToken(sessionId, tenantId);
          const { token: t2 } = await service.generateToken(sessionId, tenantId);
          // Each call must produce a different token
          expect(t1).not.toBe(t2);
        },
      ),
      { numRuns: 100 },
    );
  });

  /**
   * Property 11b: Scan pertama menghasilkan valid=true; scan kedua menghasilkan alreadyUsed=true
   * Validates: Requirements 5.2, 5.8
   */
  it('Property 11b: Token hanya valid untuk satu kali scan (one-time-use)', async () => {
    // Feature: pesantren-management-app, Property 11: QR Token Idempotency dan One-Time-Use
    await fc.assert(
      fc.asyncProperty(
        fc.uuid(),
        fc.uuid(),
        async (sessionId, tenantId) => {
          redis.clear();
          const { token } = await service.generateToken(sessionId, tenantId);

          // First validation: should be valid
          const first = await service.validateToken(token);
          expect(first.valid).toBe(true);
          expect(first.expired).toBe(false);
          expect(first.alreadyUsed).toBe(false);

          // Mark as used (simulates first scan)
          await service.markTokenUsed(token);

          // Second validation: should be alreadyUsed
          const second = await service.validateToken(token);
          expect(second.valid).toBe(false);
          expect(second.alreadyUsed).toBe(true);
        },
      ),
      { numRuns: 100 },
    );
  });

  /**
   * Property 11c: Token yang tidak ada di Redis selalu expired
   * Validates: Requirements 5.3
   */
  it('Property 11c: Token tidak dikenal selalu dikembalikan sebagai expired', async () => {
    // Feature: pesantren-management-app, Property 11: QR Token Idempotency dan One-Time-Use
    await fc.assert(
      fc.asyncProperty(
        fc.uuid(),
        async (randomToken) => {
          redis.clear();
          const result = await service.validateToken(randomToken);
          expect(result.valid).toBe(false);
          expect(result.expired).toBe(true);
          expect(result.alreadyUsed).toBe(false);
        },
      ),
      { numRuns: 100 },
    );
  });

  /**
   * Property 11d: Payload token selalu mengandung sessionId dan tenantId yang benar
   * Validates: Requirements 5.1
   */
  it('Property 11d: Payload token selalu mengandung sessionId dan tenantId yang benar', async () => {
    // Feature: pesantren-management-app, Property 11: QR Token Idempotency dan One-Time-Use
    await fc.assert(
      fc.asyncProperty(
        fc.uuid(),
        fc.uuid(),
        async (sessionId, tenantId) => {
          redis.clear();
          const { token } = await service.generateToken(sessionId, tenantId);
          const result = await service.validateToken(token);

          expect(result.valid).toBe(true);
          expect(result.payload?.sessionId).toBe(sessionId);
          expect(result.payload?.tenantId).toBe(tenantId);
          expect(result.payload?.createdAt).toBeTruthy();
          // createdAt must be a valid ISO timestamp
          expect(() => new Date(result.payload!.createdAt)).not.toThrow();
        },
      ),
      { numRuns: 100 },
    );
  });
});
