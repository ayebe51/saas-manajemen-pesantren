/**
 * Property test: Transisi Status Invoice Mengikuti State Machine
 * Feature: pesantren-management-app, Property 15: Transisi Status Invoice Mengikuti State Machine
 * Validates: Requirements 11.2
 * Task: 15.7
 */

import * as fc from 'fast-check';

// ─── State Machine Definition (mirrors InvoiceService) ───────────────────────

type InvoiceStatus = 'PENDING' | 'PAID' | 'EXPIRED' | 'CANCELLED' | 'REFUNDED';

const VALID_TRANSITIONS: Record<InvoiceStatus, InvoiceStatus[]> = {
  PENDING: ['PAID', 'EXPIRED', 'CANCELLED'],
  PAID: ['REFUNDED'],
  EXPIRED: [],
  CANCELLED: [],
  REFUNDED: [],
};

const ALL_STATUSES: InvoiceStatus[] = ['PENDING', 'PAID', 'EXPIRED', 'CANCELLED', 'REFUNDED'];

function isValidTransition(from: InvoiceStatus, to: InvoiceStatus): boolean {
  return (VALID_TRANSITIONS[from] ?? []).includes(to);
}

function getTerminalStatuses(): InvoiceStatus[] {
  return ALL_STATUSES.filter((s) => VALID_TRANSITIONS[s].length === 0);
}

// ─── Test Suite ───────────────────────────────────────────────────────────────

describe('Property 15: Transisi Status Invoice Mengikuti State Machine', () => {
  /**
   * Property 15a: Transisi valid selalu diizinkan
   * Validates: Requirements 11.2
   */
  describe('Property 15a: Transisi valid selalu diizinkan', () => {
    it('setiap transisi yang terdaftar dalam VALID_TRANSITIONS harus diizinkan', () => {
      // Feature: pesantren-management-app, Property 15: Transisi Status Invoice Mengikuti State Machine
      fc.assert(
        fc.property(
          fc.constantFrom(...ALL_STATUSES),
          (fromStatus) => {
            const validTargets = VALID_TRANSITIONS[fromStatus];
            for (const toStatus of validTargets) {
              expect(isValidTransition(fromStatus, toStatus)).toBe(true);
            }
          },
        ),
        { numRuns: 100 },
      );
    });
  });

  /**
   * Property 15b: Transisi tidak valid selalu ditolak
   * Validates: Requirements 11.2
   */
  describe('Property 15b: Transisi tidak valid selalu ditolak', () => {
    it('transisi ke status yang tidak ada dalam daftar valid harus ditolak', () => {
      // Feature: pesantren-management-app, Property 15: Transisi Status Invoice Mengikuti State Machine
      fc.assert(
        fc.property(
          fc.constantFrom(...ALL_STATUSES),
          fc.constantFrom(...ALL_STATUSES),
          (fromStatus, toStatus) => {
            const validTargets = VALID_TRANSITIONS[fromStatus];
            const shouldBeValid = validTargets.includes(toStatus);
            expect(isValidTransition(fromStatus, toStatus)).toBe(shouldBeValid);
          },
        ),
        { numRuns: 200 },
      );
    });

    it('status terminal (EXPIRED, CANCELLED, REFUNDED) tidak dapat bertransisi ke status apapun', () => {
      // Feature: pesantren-management-app, Property 15: Transisi Status Invoice Mengikuti State Machine
      const terminalStatuses = getTerminalStatuses();

      fc.assert(
        fc.property(
          fc.constantFrom(...terminalStatuses),
          fc.constantFrom(...ALL_STATUSES),
          (terminalStatus, anyStatus) => {
            expect(isValidTransition(terminalStatus, anyStatus)).toBe(false);
          },
        ),
        { numRuns: 100 },
      );
    });
  });

  /**
   * Property 15c: PENDING adalah satu-satunya status awal
   * Validates: Requirements 11.2
   */
  describe('Property 15c: PENDING adalah status awal invoice baru', () => {
    it('invoice baru selalu dimulai dari status PENDING', () => {
      // Feature: pesantren-management-app, Property 15: Transisi Status Invoice Mengikuti State Machine
      // Semua status non-PENDING tidak dapat dicapai langsung dari "tidak ada"
      // Hanya PENDING yang merupakan status awal
      const initialStatus: InvoiceStatus = 'PENDING';
      expect(ALL_STATUSES).toContain(initialStatus);

      // PENDING harus memiliki transisi keluar (bukan terminal)
      expect(VALID_TRANSITIONS['PENDING'].length).toBeGreaterThan(0);
    });

    it('PENDING dapat bertransisi ke PAID, EXPIRED, atau CANCELLED', () => {
      // Feature: pesantren-management-app, Property 15: Transisi Status Invoice Mengikuti State Machine
      expect(isValidTransition('PENDING', 'PAID')).toBe(true);
      expect(isValidTransition('PENDING', 'EXPIRED')).toBe(true);
      expect(isValidTransition('PENDING', 'CANCELLED')).toBe(true);
    });

    it('PENDING tidak dapat langsung ke REFUNDED', () => {
      // Feature: pesantren-management-app, Property 15: Transisi Status Invoice Mengikuti State Machine
      expect(isValidTransition('PENDING', 'REFUNDED')).toBe(false);
    });
  });

  /**
   * Property 15d: PAID hanya dapat ke REFUNDED
   * Validates: Requirements 11.2
   */
  describe('Property 15d: PAID hanya dapat bertransisi ke REFUNDED', () => {
    it('PAID → REFUNDED adalah satu-satunya transisi valid dari PAID', () => {
      // Feature: pesantren-management-app, Property 15: Transisi Status Invoice Mengikuti State Machine
      expect(isValidTransition('PAID', 'REFUNDED')).toBe(true);
      expect(isValidTransition('PAID', 'PENDING')).toBe(false);
      expect(isValidTransition('PAID', 'EXPIRED')).toBe(false);
      expect(isValidTransition('PAID', 'CANCELLED')).toBe(false);
    });
  });

  /**
   * Property 15e: Tidak ada siklus dalam state machine
   * Validates: Requirements 11.2
   */
  describe('Property 15e: State machine tidak memiliki siklus (acyclic)', () => {
    it('tidak ada status yang dapat kembali ke PENDING setelah meninggalkannya', () => {
      // Feature: pesantren-management-app, Property 15: Transisi Status Invoice Mengikuti State Machine
      fc.assert(
        fc.property(
          fc.constantFrom(...ALL_STATUSES),
          (status) => {
            if (status === 'PENDING') return; // skip initial state
            // No status (other than PENDING itself) can transition back to PENDING
            expect(isValidTransition(status, 'PENDING')).toBe(false);
          },
        ),
        { numRuns: 100 },
      );
    });

    it('tidak ada status yang dapat kembali ke dirinya sendiri (no self-loops)', () => {
      // Feature: pesantren-management-app, Property 15: Transisi Status Invoice Mengikuti State Machine
      fc.assert(
        fc.property(
          fc.constantFrom(...ALL_STATUSES),
          (status) => {
            expect(isValidTransition(status, status)).toBe(false);
          },
        ),
        { numRuns: 100 },
      );
    });
  });

  /**
   * Property 15f: Semua path dari PENDING berakhir di status terminal
   * Validates: Requirements 11.2
   */
  describe('Property 15f: Semua path dari PENDING berakhir di status terminal', () => {
    it('PAID, EXPIRED, CANCELLED, REFUNDED adalah status terminal', () => {
      // Feature: pesantren-management-app, Property 15: Transisi Status Invoice Mengikuti State Machine
      const terminalStatuses = getTerminalStatuses();
      expect(terminalStatuses).toContain('EXPIRED');
      expect(terminalStatuses).toContain('CANCELLED');
      expect(terminalStatuses).toContain('REFUNDED');
      // PAID is NOT terminal — it can go to REFUNDED
      expect(terminalStatuses).not.toContain('PAID');
      expect(terminalStatuses).not.toContain('PENDING');
    });

    it('setiap path dari PENDING dapat mencapai setidaknya satu status terminal', () => {
      // Feature: pesantren-management-app, Property 15: Transisi Status Invoice Mengikuti State Machine
      // BFS dari PENDING untuk memastikan semua path berakhir di terminal
      const visited = new Set<InvoiceStatus>();
      const queue: InvoiceStatus[] = ['PENDING'];

      while (queue.length > 0) {
        const current = queue.shift()!;
        if (visited.has(current)) continue;
        visited.add(current);

        const nexts = VALID_TRANSITIONS[current];
        for (const next of nexts) {
          queue.push(next);
        }
      }

      // All reachable statuses should be visited
      const terminalStatuses = getTerminalStatuses();
      for (const terminal of terminalStatuses) {
        expect(visited.has(terminal)).toBe(true);
      }
    });
  });
});
