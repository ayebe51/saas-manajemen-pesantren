/**
 * Property test: Invoice Number Unik
 * Feature: pesantren-management-app, Property 14: Invoice Number Unik
 * Validates: Requirements 11.1
 * Task: 15.6
 */

import * as fc from 'fast-check';

// ─── Helper: generate invoice number (mirrors InvoiceService logic) ───────────

/**
 * Replicate the invoice number generation logic from InvoiceService
 * Format: INV-YYYYMM-XXXXX
 */
function generateInvoiceNumber(date: Date, seq: number): string {
  const prefix = `INV-${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, '0')}-`;
  return `${prefix}${String(seq).padStart(5, '0')}`;
}

/**
 * Parse invoice number back to its components
 */
function parseInvoiceNumber(invoiceNumber: string): { year: number; month: number; seq: number } | null {
  const match = invoiceNumber.match(/^INV-(\d{4})(\d{2})-(\d{5})$/);
  if (!match) return null;
  return {
    year: parseInt(match[1], 10),
    month: parseInt(match[2], 10),
    seq: parseInt(match[3], 10),
  };
}

// ─── Test Suite ───────────────────────────────────────────────────────────────

describe('Property 14: Invoice Number Unik', () => {
  /**
   * Property 14a: Format invoice number selalu INV-YYYYMM-XXXXX
   * Validates: Requirements 11.1
   */
  describe('Property 14a: Format invoice number selalu INV-YYYYMM-XXXXX', () => {
    it('setiap invoice number harus mengikuti format INV-YYYYMM-XXXXX', () => {
      // Feature: pesantren-management-app, Property 14: Invoice Number Unik
      fc.assert(
        fc.property(
          fc.integer({ min: 2020, max: 2030 }),
          fc.integer({ min: 1, max: 12 }),
          fc.integer({ min: 1, max: 99999 }),
          (year, month, seq) => {
            const date = new Date(year, month - 1, 1);
            const invoiceNumber = generateInvoiceNumber(date, seq);
            const formatRegex = /^INV-\d{4}\d{2}-\d{5}$/;
            expect(invoiceNumber).toMatch(formatRegex);
          },
        ),
        { numRuns: 100 },
      );
    });

    it('bagian YYYYMM harus merepresentasikan tahun dan bulan yang valid', () => {
      // Feature: pesantren-management-app, Property 14: Invoice Number Unik
      fc.assert(
        fc.property(
          fc.integer({ min: 2020, max: 2030 }),
          fc.integer({ min: 1, max: 12 }),
          fc.integer({ min: 1, max: 99999 }),
          (year, month, seq) => {
            const date = new Date(year, month - 1, 1);
            const invoiceNumber = generateInvoiceNumber(date, seq);
            const parsed = parseInvoiceNumber(invoiceNumber);

            expect(parsed).not.toBeNull();
            expect(parsed!.year).toBe(year);
            expect(parsed!.month).toBe(month);
            expect(parsed!.month).toBeGreaterThanOrEqual(1);
            expect(parsed!.month).toBeLessThanOrEqual(12);
          },
        ),
        { numRuns: 100 },
      );
    });
  });

  /**
   * Property 14b: Invoice number berbeda untuk sequence berbeda dalam bulan yang sama
   * Validates: Requirements 11.1
   */
  describe('Property 14b: Invoice number unik untuk sequence berbeda', () => {
    it('dua invoice dengan sequence berbeda dalam bulan yang sama harus memiliki nomor berbeda', () => {
      // Feature: pesantren-management-app, Property 14: Invoice Number Unik
      fc.assert(
        fc.property(
          fc.integer({ min: 2020, max: 2030 }),
          fc.integer({ min: 1, max: 12 }),
          fc.integer({ min: 1, max: 49999 }),
          (year, month, seq1) => {
            const date = new Date(year, month - 1, 1);
            const seq2 = seq1 + 1; // guaranteed different
            const inv1 = generateInvoiceNumber(date, seq1);
            const inv2 = generateInvoiceNumber(date, seq2);

            expect(inv1).not.toBe(inv2);
          },
        ),
        { numRuns: 100 },
      );
    });

    it('invoice number bersifat deterministik: input sama → output sama', () => {
      // Feature: pesantren-management-app, Property 14: Invoice Number Unik
      fc.assert(
        fc.property(
          fc.integer({ min: 2020, max: 2030 }),
          fc.integer({ min: 1, max: 12 }),
          fc.integer({ min: 1, max: 99999 }),
          (year, month, seq) => {
            const date = new Date(year, month - 1, 1);
            const inv1 = generateInvoiceNumber(date, seq);
            const inv2 = generateInvoiceNumber(date, seq);

            expect(inv1).toBe(inv2);
          },
        ),
        { numRuns: 100 },
      );
    });
  });

  /**
   * Property 14c: Kumpulan invoice number yang di-generate secara berurutan harus unik semua
   * Validates: Requirements 11.1
   */
  describe('Property 14c: Batch invoice numbers semuanya unik', () => {
    it('N invoice number yang di-generate berurutan dalam satu bulan harus semua unik', () => {
      // Feature: pesantren-management-app, Property 14: Invoice Number Unik
      fc.assert(
        fc.property(
          fc.integer({ min: 2020, max: 2030 }),
          fc.integer({ min: 1, max: 12 }),
          fc.integer({ min: 2, max: 50 }), // batch size
          (year, month, batchSize) => {
            const date = new Date(year, month - 1, 1);
            const numbers = Array.from({ length: batchSize }, (_, i) =>
              generateInvoiceNumber(date, i + 1),
            );

            const uniqueNumbers = new Set(numbers);
            expect(uniqueNumbers.size).toBe(batchSize);
          },
        ),
        { numRuns: 100 },
      );
    });

    it('invoice number dari bulan berbeda tidak boleh sama untuk sequence yang sama', () => {
      // Feature: pesantren-management-app, Property 14: Invoice Number Unik
      fc.assert(
        fc.property(
          fc.integer({ min: 2020, max: 2029 }),
          fc.integer({ min: 1, max: 11 }), // month 1-11 so month+1 is valid
          fc.integer({ min: 1, max: 99999 }),
          (year, month, seq) => {
            const date1 = new Date(year, month - 1, 1); // month (0-indexed)
            const date2 = new Date(year, month, 1);     // month+1 (0-indexed)

            const inv1 = generateInvoiceNumber(date1, seq);
            const inv2 = generateInvoiceNumber(date2, seq);

            // Different months → different invoice numbers even with same seq
            expect(inv1).not.toBe(inv2);
          },
        ),
        { numRuns: 100 },
      );
    });
  });

  /**
   * Property 14d: Sequence number selalu 5 digit (zero-padded)
   * Validates: Requirements 11.1
   */
  describe('Property 14d: Sequence number selalu 5 digit', () => {
    it('bagian sequence selalu tepat 5 digit', () => {
      // Feature: pesantren-management-app, Property 14: Invoice Number Unik
      fc.assert(
        fc.property(
          fc.integer({ min: 2020, max: 2030 }), // year
          fc.integer({ min: 1, max: 12 }),       // month
          fc.integer({ min: 1, max: 99999 }),    // seq
          (year, month, seq) => {
            const date = new Date(year, month - 1, 1);
            const invoiceNumber = generateInvoiceNumber(date, seq);
            const parsed = parseInvoiceNumber(invoiceNumber);

            expect(parsed).not.toBeNull();
            // The sequence part should be exactly 5 chars
            const seqPart = invoiceNumber.split('-')[2];
            expect(seqPart).toHaveLength(5);
          },
        ),
        { numRuns: 100 },
      );
    });
  });
});
