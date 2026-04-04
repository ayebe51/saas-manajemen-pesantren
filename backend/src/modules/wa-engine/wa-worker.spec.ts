import * as fc from 'fast-check';
import { calculateNextRetry } from './wa-worker.service';

// Feature: pesantren-management-app, Property 19: Retry Backoff Mengikuti Kebijakan Exponential

describe('WaWorker — Retry Backoff', () => {
  /**
   * Property 19: Retry Backoff Mengikuti Kebijakan Exponential
   *
   * Untuk semua pesan WA yang gagal dikirim, delay sebelum retry ke-N harus berada
   * dalam rentang (2^(N-1) * 60 * 0.9) hingga (2^(N-1) * 60 * 1.1) detik.
   * Setelah 5 kali gagal, pesan harus dipindahkan ke DLQ.
   *
   * Validates: Requirements 18.2, 18.3
   */
  it('Property 19: delay retry ke-N berada dalam rentang exponential backoff ±10%', () => {
    // Feature: pesantren-management-app, Property 19: Retry Backoff Mengikuti Kebijakan Exponential
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 5 }), // retryCount 1..5
        (retryCount) => {
          const before = Date.now();
          const nextRetry = calculateNextRetry(retryCount);
          const after = Date.now();

          const delayMs = nextRetry.getTime() - before;

          // Base delay: 60 * 2^(retryCount-1) detik
          const baseDelaySeconds = 60 * Math.pow(2, retryCount - 1);
          const minDelayMs = baseDelaySeconds * 0.9 * 1000;
          const maxDelayMs = baseDelaySeconds * 1.1 * 1000;

          // Toleransi kecil untuk waktu eksekusi test (50ms)
          const tolerance = 50;

          expect(delayMs).toBeGreaterThanOrEqual(minDelayMs - tolerance);
          expect(delayMs).toBeLessThanOrEqual(maxDelayMs + tolerance);

          // nextRetry harus di masa depan
          expect(nextRetry.getTime()).toBeGreaterThan(before);
        },
      ),
      { numRuns: 100 },
    );
  });

  it('Property 19: delay meningkat secara exponential seiring retryCount bertambah', () => {
    // Feature: pesantren-management-app, Property 19: Retry Backoff Mengikuti Kebijakan Exponential
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 4 }), // retryCount 1..4 (bandingkan N vs N+1)
        (retryCount) => {
          // Ambil rata-rata dari beberapa sample untuk mengurangi noise jitter
          const samples = 10;
          let sumN = 0;
          let sumN1 = 0;

          for (let i = 0; i < samples; i++) {
            const before = Date.now();
            sumN += calculateNextRetry(retryCount).getTime() - before;
            sumN1 += calculateNextRetry(retryCount + 1).getTime() - before;
          }

          const avgN = sumN / samples;
          const avgN1 = sumN1 / samples;

          // Rata-rata delay N+1 harus lebih besar dari N
          // (dengan toleransi karena jitter)
          const baseN = 60 * Math.pow(2, retryCount - 1) * 1000;
          const baseN1 = 60 * Math.pow(2, retryCount) * 1000;

          // avgN harus mendekati baseN (dalam ±15% untuk toleransi jitter + timing)
          expect(avgN).toBeGreaterThan(baseN * 0.85);
          expect(avgN).toBeLessThan(baseN * 1.15);

          // avgN1 harus mendekati baseN1
          expect(avgN1).toBeGreaterThan(baseN1 * 0.85);
          expect(avgN1).toBeLessThan(baseN1 * 1.15);
        },
      ),
      { numRuns: 50 },
    );
  });

  describe('Nilai spesifik retry delay', () => {
    const cases = [
      { retryCount: 1, expectedBaseSeconds: 60 },   // 1 menit
      { retryCount: 2, expectedBaseSeconds: 120 },  // 2 menit
      { retryCount: 3, expectedBaseSeconds: 240 },  // 4 menit
      { retryCount: 4, expectedBaseSeconds: 480 },  // 8 menit
      { retryCount: 5, expectedBaseSeconds: 960 },  // 16 menit
    ];

    cases.forEach(({ retryCount, expectedBaseSeconds }) => {
      it(`retry ke-${retryCount}: delay ~${expectedBaseSeconds}s (±10%)`, () => {
        const before = Date.now();
        const nextRetry = calculateNextRetry(retryCount);
        const delayMs = nextRetry.getTime() - before;

        const minMs = expectedBaseSeconds * 0.9 * 1000;
        const maxMs = expectedBaseSeconds * 1.1 * 1000;

        expect(delayMs).toBeGreaterThanOrEqual(minMs - 50);
        expect(delayMs).toBeLessThanOrEqual(maxMs + 50);
      });
    });
  });
});
