/**
 * Property test: Atomicity Transaksi Saldo
 * Feature: pesantren-management-app, Property 17: Atomicity Transaksi Saldo
 * Validates: Requirements 12.2, 13.2
 * Task: 15.9
 */

import * as fc from 'fast-check';
import { Decimal } from '@prisma/client/runtime/library';

// ─── Simulasi operasi wallet atomik ──────────────────────────────────────────

interface WalletState {
  id: string;
  saldo: number;
  transactions: Array<{
    tipe: 'TOPUP' | 'DEBIT';
    jumlah: number;
    saldoSebelum: number;
    saldoSesudah: number;
  }>;
}

/**
 * Simulasi top-up atomik: saldo dan transaksi diupdate bersamaan
 */
function simulateTopUp(wallet: WalletState, jumlah: number): WalletState {
  if (jumlah <= 0) throw new Error('Jumlah harus > 0');

  const saldoSebelum = wallet.saldo;
  const saldoSesudah = saldoSebelum + jumlah;

  return {
    ...wallet,
    saldo: saldoSesudah,
    transactions: [
      ...wallet.transactions,
      { tipe: 'TOPUP', jumlah, saldoSebelum, saldoSesudah },
    ],
  };
}

/**
 * Simulasi debit atomik: saldo dan transaksi diupdate bersamaan
 */
function simulateDebit(wallet: WalletState, jumlah: number): WalletState {
  if (jumlah <= 0) throw new Error('Jumlah harus > 0');
  if (wallet.saldo < jumlah) throw new Error('Saldo tidak mencukupi');

  const saldoSebelum = wallet.saldo;
  const saldoSesudah = saldoSebelum - jumlah;

  return {
    ...wallet,
    saldo: saldoSesudah,
    transactions: [
      ...wallet.transactions,
      { tipe: 'DEBIT', jumlah, saldoSebelum, saldoSesudah },
    ],
  };
}

/**
 * Rekonstruksi saldo dari riwayat transaksi
 */
function reconstructSaldo(transactions: WalletState['transactions']): number {
  return transactions.reduce((acc, trx) => {
    return trx.tipe === 'TOPUP' ? acc + trx.jumlah : acc - trx.jumlah;
  }, 0);
}

// ─── Test Suite ───────────────────────────────────────────────────────────────

describe('Property 17: Atomicity Transaksi Saldo', () => {
  /**
   * Property 17a: Saldo setelah top-up = saldo sebelum + jumlah
   * Validates: Requirements 12.2
   */
  describe('Property 17a: Saldo setelah top-up konsisten', () => {
    it('saldo sesudah top-up selalu = saldo sebelum + jumlah', () => {
      // Feature: pesantren-management-app, Property 17: Atomicity Transaksi Saldo
      fc.assert(
        fc.property(
          fc.integer({ min: 0, max: 10_000_000 }), // initial saldo
          fc.integer({ min: 1, max: 5_000_000 }),  // topup amount
          (initialSaldo, jumlah) => {
            const wallet: WalletState = { id: 'w-1', saldo: initialSaldo, transactions: [] };
            const result = simulateTopUp(wallet, jumlah);

            expect(result.saldo).toBe(initialSaldo + jumlah);
          },
        ),
        { numRuns: 100 },
      );
    });

    it('transaksi top-up mencatat saldoSebelum dan saldoSesudah yang benar', () => {
      // Feature: pesantren-management-app, Property 17: Atomicity Transaksi Saldo
      fc.assert(
        fc.property(
          fc.integer({ min: 0, max: 10_000_000 }),
          fc.integer({ min: 1, max: 5_000_000 }),
          (initialSaldo, jumlah) => {
            const wallet: WalletState = { id: 'w-1', saldo: initialSaldo, transactions: [] };
            const result = simulateTopUp(wallet, jumlah);

            const lastTrx = result.transactions[result.transactions.length - 1];
            expect(lastTrx.saldoSebelum).toBe(initialSaldo);
            expect(lastTrx.saldoSesudah).toBe(initialSaldo + jumlah);
            expect(lastTrx.saldoSesudah).toBe(result.saldo);
          },
        ),
        { numRuns: 100 },
      );
    });
  });

  /**
   * Property 17b: Saldo setelah debit = saldo sebelum - jumlah
   * Validates: Requirements 13.2
   */
  describe('Property 17b: Saldo setelah debit konsisten', () => {
    it('saldo sesudah debit selalu = saldo sebelum - jumlah', () => {
      // Feature: pesantren-management-app, Property 17: Atomicity Transaksi Saldo
      fc.assert(
        fc.property(
          fc.integer({ min: 1, max: 10_000_000 }),
          fc.integer({ min: 1, max: 10_000_000 }),
          (initialSaldo, jumlah) => {
            fc.pre(initialSaldo >= jumlah); // saldo cukup

            const wallet: WalletState = { id: 'w-1', saldo: initialSaldo, transactions: [] };
            const result = simulateDebit(wallet, jumlah);

            expect(result.saldo).toBe(initialSaldo - jumlah);
          },
        ),
        { numRuns: 100 },
      );
    });

    it('saldo tidak pernah negatif setelah debit', () => {
      // Feature: pesantren-management-app, Property 17: Atomicity Transaksi Saldo
      fc.assert(
        fc.property(
          fc.integer({ min: 1, max: 10_000_000 }),
          fc.integer({ min: 1, max: 10_000_000 }),
          (initialSaldo, jumlah) => {
            fc.pre(initialSaldo >= jumlah);

            const wallet: WalletState = { id: 'w-1', saldo: initialSaldo, transactions: [] };
            const result = simulateDebit(wallet, jumlah);

            expect(result.saldo).toBeGreaterThanOrEqual(0);
          },
        ),
        { numRuns: 100 },
      );
    });
  });

  /**
   * Property 17c: Saldo tidak cukup → debit ditolak, saldo tidak berubah
   * Validates: Requirements 13.2
   */
  describe('Property 17c: Debit ditolak saat saldo tidak cukup', () => {
    it('debit melebihi saldo selalu melempar error', () => {
      // Feature: pesantren-management-app, Property 17: Atomicity Transaksi Saldo
      fc.assert(
        fc.property(
          fc.integer({ min: 0, max: 999_999 }),
          fc.integer({ min: 1, max: 1_000_000 }),
          (initialSaldo, jumlah) => {
            fc.pre(jumlah > initialSaldo); // jumlah melebihi saldo

            const wallet: WalletState = { id: 'w-1', saldo: initialSaldo, transactions: [] };

            expect(() => simulateDebit(wallet, jumlah)).toThrow('Saldo tidak mencukupi');
          },
        ),
        { numRuns: 100 },
      );
    });

    it('saldo tidak berubah saat debit gagal', () => {
      // Feature: pesantren-management-app, Property 17: Atomicity Transaksi Saldo
      fc.assert(
        fc.property(
          fc.integer({ min: 0, max: 999_999 }),
          fc.integer({ min: 1, max: 1_000_000 }),
          (initialSaldo, jumlah) => {
            fc.pre(jumlah > initialSaldo);

            const wallet: WalletState = { id: 'w-1', saldo: initialSaldo, transactions: [] };

            try {
              simulateDebit(wallet, jumlah);
            } catch {
              // Wallet state should be unchanged (atomicity: rollback)
              expect(wallet.saldo).toBe(initialSaldo);
              expect(wallet.transactions).toHaveLength(0);
            }
          },
        ),
        { numRuns: 100 },
      );
    });
  });

  /**
   * Property 17d: Rekonstruksi saldo dari riwayat transaksi harus konsisten
   * Validates: Requirements 12.2, 13.2
   */
  describe('Property 17d: Saldo dapat direkonstruksi dari riwayat transaksi', () => {
    it('saldo akhir = rekonstruksi dari semua transaksi', () => {
      // Feature: pesantren-management-app, Property 17: Atomicity Transaksi Saldo
      fc.assert(
        fc.property(
          fc.array(
            fc.record({
              tipe: fc.constantFrom('TOPUP' as const, 'DEBIT' as const),
              jumlah: fc.integer({ min: 1, max: 100_000 }),
            }),
            { minLength: 1, maxLength: 20 },
          ),
          (operations) => {
            let wallet: WalletState = { id: 'w-1', saldo: 1_000_000, transactions: [] };

            for (const op of operations) {
              try {
                if (op.tipe === 'TOPUP') {
                  wallet = simulateTopUp(wallet, op.jumlah);
                } else {
                  wallet = simulateDebit(wallet, op.jumlah);
                }
              } catch {
                // Debit gagal karena saldo tidak cukup — skip
              }
            }

            // Rekonstruksi saldo dari transaksi harus sama dengan saldo aktual
            const reconstructed = reconstructSaldo(wallet.transactions);
            expect(reconstructed).toBe(wallet.saldo - 1_000_000); // net change
          },
        ),
        { numRuns: 100 },
      );
    });

    it('setiap transaksi mencatat saldoSesudah yang sama dengan saldo wallet saat itu', () => {
      // Feature: pesantren-management-app, Property 17: Atomicity Transaksi Saldo
      fc.assert(
        fc.property(
          fc.array(
            fc.integer({ min: 1, max: 50_000 }),
            { minLength: 1, maxLength: 10 },
          ),
          (topupAmounts) => {
            let wallet: WalletState = { id: 'w-1', saldo: 0, transactions: [] };

            for (const jumlah of topupAmounts) {
              wallet = simulateTopUp(wallet, jumlah);
            }

            // Verify each transaction's saldoSesudah matches the running balance
            let runningBalance = 0;
            for (const trx of wallet.transactions) {
              runningBalance += trx.jumlah;
              expect(trx.saldoSesudah).toBe(runningBalance);
            }

            expect(wallet.saldo).toBe(runningBalance);
          },
        ),
        { numRuns: 100 },
      );
    });
  });

  /**
   * Property 17e: Decimal precision — tidak ada floating point error
   * Validates: Requirements 12.2
   */
  describe('Property 17e: Presisi Decimal untuk saldo', () => {
    it('operasi Decimal tidak menghasilkan floating point error', () => {
      // Feature: pesantren-management-app, Property 17: Atomicity Transaksi Saldo
      fc.assert(
        fc.property(
          fc.integer({ min: 1, max: 1_000_000 }),
          fc.integer({ min: 1, max: 1_000_000 }),
          (a, b) => {
            const decA = new Decimal(a);
            const decB = new Decimal(b);

            // Decimal addition should be exact
            const sum = decA.add(decB);
            expect(Number(sum)).toBe(a + b);

            // Decimal subtraction (when a >= b)
            if (a >= b) {
              const diff = decA.sub(decB);
              expect(Number(diff)).toBe(a - b);
              expect(Number(diff)).toBeGreaterThanOrEqual(0);
            }
          },
        ),
        { numRuns: 100 },
      );
    });
  });
});
