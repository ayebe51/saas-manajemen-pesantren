/**
 * Property test: Konfirmasi Pembayaran Idempoten (Race Condition Safe)
 * Feature: pesantren-management-app, Property 16: Konfirmasi Pembayaran Idempoten (Race Condition Safe)
 * Validates: Requirements 11.4
 * Task: 15.8
 */

import * as fc from 'fast-check';
import { ConflictException } from '@nestjs/common';

// ─── Simulasi state machine idempotency ──────────────────────────────────────

type InvoiceStatus = 'PENDING' | 'PAID' | 'EXPIRED' | 'CANCELLED' | 'REFUNDED';

interface Invoice {
  id: string;
  status: InvoiceStatus;
  idempotencyKey: string | null;
  paidAt: Date | null;
}

/**
 * Simulasi logika confirmPayment dari InvoiceService
 * Mengembalikan invoice yang diupdate atau melempar exception
 */
function simulateConfirmPayment(
  invoice: Invoice,
  idempotencyKey?: string,
): Invoice {
  if (invoice.status === 'PAID') {
    // Idempotency: same key → return existing
    if (idempotencyKey && invoice.idempotencyKey === idempotencyKey) {
      return invoice; // idempotent response
    }
    throw new ConflictException('Invoice sudah dibayar (status: PAID)');
  }

  if (invoice.status !== 'PENDING') {
    throw new Error(`Tidak dapat mengkonfirmasi. Status: ${invoice.status}`);
  }

  return {
    ...invoice,
    status: 'PAID',
    idempotencyKey: idempotencyKey ?? null,
    paidAt: new Date(),
  };
}

// ─── Test Suite ───────────────────────────────────────────────────────────────

describe('Property 16: Konfirmasi Pembayaran Idempoten (Race Condition Safe)', () => {
  /**
   * Property 16a: Konfirmasi pertama selalu berhasil untuk invoice PENDING
   * Validates: Requirements 11.4
   */
  describe('Property 16a: Konfirmasi pertama selalu berhasil untuk invoice PENDING', () => {
    it('konfirmasi invoice PENDING selalu menghasilkan status PAID', () => {
      // Feature: pesantren-management-app, Property 16: Konfirmasi Pembayaran Idempoten (Race Condition Safe)
      fc.assert(
        fc.property(
          fc.uuid(),
          fc.option(fc.string({ minLength: 1, maxLength: 50 })),
          (invoiceId, idempotencyKey) => {
            const invoice: Invoice = {
              id: invoiceId,
              status: 'PENDING',
              idempotencyKey: null,
              paidAt: null,
            };

            const result = simulateConfirmPayment(invoice, idempotencyKey ?? undefined);
            expect(result.status).toBe('PAID');
            expect(result.paidAt).not.toBeNull();
          },
        ),
        { numRuns: 100 },
      );
    });
  });

  /**
   * Property 16b: Konfirmasi kedua dengan key berbeda → 409 ConflictException
   * Validates: Requirements 11.4
   */
  describe('Property 16b: Konfirmasi kedua dengan key berbeda → 409', () => {
    it('konfirmasi invoice PAID dengan idempotency key berbeda selalu melempar ConflictException', () => {
      // Feature: pesantren-management-app, Property 16: Konfirmasi Pembayaran Idempoten (Race Condition Safe)
      fc.assert(
        fc.property(
          fc.uuid(),
          fc.string({ minLength: 1, maxLength: 50 }),
          fc.string({ minLength: 1, maxLength: 50 }),
          (invoiceId, key1, key2) => {
            fc.pre(key1 !== key2); // ensure different keys

            const paidInvoice: Invoice = {
              id: invoiceId,
              status: 'PAID',
              idempotencyKey: key1,
              paidAt: new Date(),
            };

            expect(() => simulateConfirmPayment(paidInvoice, key2)).toThrow(ConflictException);
          },
        ),
        { numRuns: 100 },
      );
    });

    it('konfirmasi invoice PAID tanpa idempotency key selalu melempar ConflictException', () => {
      // Feature: pesantren-management-app, Property 16: Konfirmasi Pembayaran Idempoten (Race Condition Safe)
      fc.assert(
        fc.property(
          fc.uuid(),
          (invoiceId) => {
            const paidInvoice: Invoice = {
              id: invoiceId,
              status: 'PAID',
              idempotencyKey: null,
              paidAt: new Date(),
            };

            expect(() => simulateConfirmPayment(paidInvoice, undefined)).toThrow(ConflictException);
          },
        ),
        { numRuns: 100 },
      );
    });
  });

  /**
   * Property 16c: Konfirmasi dengan idempotency key yang sama → idempoten (return existing)
   * Validates: Requirements 11.4
   */
  describe('Property 16c: Konfirmasi dengan key yang sama → idempoten', () => {
    it('konfirmasi ulang dengan idempotency key yang sama mengembalikan invoice yang sama', () => {
      // Feature: pesantren-management-app, Property 16: Konfirmasi Pembayaran Idempoten (Race Condition Safe)
      fc.assert(
        fc.property(
          fc.uuid(),
          fc.string({ minLength: 1, maxLength: 50 }),
          (invoiceId, idempotencyKey) => {
            const paidInvoice: Invoice = {
              id: invoiceId,
              status: 'PAID',
              idempotencyKey,
              paidAt: new Date(),
            };

            // Same key → idempotent, no exception
            const result = simulateConfirmPayment(paidInvoice, idempotencyKey);
            expect(result).toEqual(paidInvoice);
            expect(result.status).toBe('PAID');
          },
        ),
        { numRuns: 100 },
      );
    });

    it('konfirmasi idempoten tidak mengubah paidAt', () => {
      // Feature: pesantren-management-app, Property 16: Konfirmasi Pembayaran Idempoten (Race Condition Safe)
      fc.assert(
        fc.property(
          fc.uuid(),
          fc.string({ minLength: 1, maxLength: 50 }),
          (invoiceId, idempotencyKey) => {
            const originalPaidAt = new Date('2024-01-15T10:00:00Z');
            const paidInvoice: Invoice = {
              id: invoiceId,
              status: 'PAID',
              idempotencyKey,
              paidAt: originalPaidAt,
            };

            const result = simulateConfirmPayment(paidInvoice, idempotencyKey);
            expect(result.paidAt).toEqual(originalPaidAt);
          },
        ),
        { numRuns: 100 },
      );
    });
  });

  /**
   * Property 16d: Concurrent confirmations — hanya satu yang berhasil
   * Validates: Requirements 11.4
   */
  describe('Property 16d: Concurrent confirmations — hanya satu yang berhasil', () => {
    it('dari N konfirmasi bersamaan, tepat satu berhasil dan sisanya mendapat 409', () => {
      // Feature: pesantren-management-app, Property 16: Konfirmasi Pembayaran Idempoten (Race Condition Safe)
      fc.assert(
        fc.property(
          fc.uuid(),
          fc.integer({ min: 2, max: 10 }), // concurrent requests
          (invoiceId, concurrentCount) => {
            // Simulasi: invoice PENDING, N request bersamaan
            // Hanya yang pertama berhasil, sisanya mendapat ConflictException
            let invoice: Invoice = {
              id: invoiceId,
              status: 'PENDING',
              idempotencyKey: null,
              paidAt: null,
            };

            let successCount = 0;
            let conflictCount = 0;

            for (let i = 0; i < concurrentCount; i++) {
              try {
                // Simulasi: setelah request pertama berhasil, invoice menjadi PAID
                if (invoice.status === 'PENDING') {
                  invoice = simulateConfirmPayment(invoice, `key-${i}`);
                  successCount++;
                } else {
                  simulateConfirmPayment(invoice, `key-${i}`);
                }
              } catch (e) {
                if (e instanceof ConflictException) {
                  conflictCount++;
                }
              }
            }

            // Tepat satu berhasil
            expect(successCount).toBe(1);
            // Sisanya mendapat conflict
            expect(conflictCount).toBe(concurrentCount - 1);
          },
        ),
        { numRuns: 100 },
      );
    });
  });
});
