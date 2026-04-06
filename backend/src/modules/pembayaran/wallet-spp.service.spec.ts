/**
 * Unit test: Saldo tidak cukup → 422, jumlah negatif → 400
 * Requirements: 13.3, 12.2
 * Task: 15.10
 */

import { Test, TestingModule } from '@nestjs/testing';
import { UnprocessableEntityException, NotFoundException } from '@nestjs/common';
import { WalletSppService } from './wallet-spp.service';
import { PrismaService } from '../../common/prisma/prisma.service';
import { AuditLogService } from '../audit-log/audit-log.service';
import { Decimal } from '@prisma/client/runtime/library';

describe('WalletSppService — Unit Tests (Task 15.10)', () => {
  let service: WalletSppService;
  let mockPrisma: any;
  let mockAuditLog: any;

  const makeWallet = (saldo: number, id = 'wallet-1', santriId = 'santri-1', tenantId = 'tenant-1') => ({
    id,
    santriId,
    tenantId,
    saldo: new Decimal(saldo),
    balance: saldo,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
    transactions: [],
  });

  beforeEach(async () => {
    mockAuditLog = {
      log: jest.fn().mockResolvedValue(undefined),
    };

    mockPrisma = {
      wallet: {
        findUnique: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
      },
      santri: {
        findFirst: jest.fn(),
      },
      walletTransaction: {
        create: jest.fn(),
      },
      $transaction: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        WalletSppService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: AuditLogService, useValue: mockAuditLog },
      ],
    }).compile();

    service = module.get<WalletSppService>(WalletSppService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  // ─── Jumlah negatif / nol → 422 UnprocessableEntityException ─────────────────

  describe('topUp — jumlah negatif atau nol → 422 UnprocessableEntityException', () => {
    it('melempar UnprocessableEntityException saat jumlah = 0', async () => {
      await expect(
        service.topUp('tenant-1', { santriId: 'santri-1', jumlah: 0 }, 'user-1'),
      ).rejects.toThrow(UnprocessableEntityException);
    });

    it('melempar UnprocessableEntityException saat jumlah negatif', async () => {
      await expect(
        service.topUp('tenant-1', { santriId: 'santri-1', jumlah: -100 }, 'user-1'),
      ).rejects.toThrow(UnprocessableEntityException);
    });

    it('pesan error mengandung "lebih dari 0" untuk jumlah negatif', async () => {
      await expect(
        service.topUp('tenant-1', { santriId: 'santri-1', jumlah: -500 }, 'user-1'),
      ).rejects.toThrow(/lebih dari 0/);
    });
  });

  describe('debit — jumlah negatif atau nol → 422 UnprocessableEntityException', () => {
    it('melempar UnprocessableEntityException saat jumlah debit = 0', async () => {
      await expect(
        service.debit('tenant-1', 'santri-1', 0, 'test', 'user-1'),
      ).rejects.toThrow(UnprocessableEntityException);
    });

    it('melempar UnprocessableEntityException saat jumlah debit negatif', async () => {
      await expect(
        service.debit('tenant-1', 'santri-1', -200, 'test', 'user-1'),
      ).rejects.toThrow(UnprocessableEntityException);
    });
  });

  // ─── Saldo tidak cukup → 422 UnprocessableEntityException ────────────────────

  describe('debit — saldo tidak cukup → 422 UnprocessableEntityException', () => {
    it('melempar UnprocessableEntityException saat saldo < jumlah debit', async () => {
      // Wallet dengan saldo 100, debit 500
      mockPrisma.$transaction.mockImplementation(async (callback: any) => {
        const tx = {
          wallet: {
            findUnique: jest.fn().mockResolvedValue(makeWallet(100)),
            update: jest.fn(),
          },
          walletTransaction: {
            create: jest.fn(),
          },
        };
        return callback(tx);
      });

      await expect(
        service.debit('tenant-1', 'santri-1', 500, 'pembelian', 'user-1'),
      ).rejects.toThrow(UnprocessableEntityException);
    });

    it('pesan error mengandung informasi saldo saat ini', async () => {
      mockPrisma.$transaction.mockImplementation(async (callback: any) => {
        const tx = {
          wallet: {
            findUnique: jest.fn().mockResolvedValue(makeWallet(50)),
            update: jest.fn(),
          },
          walletTransaction: { create: jest.fn() },
        };
        return callback(tx);
      });

      await expect(
        service.debit('tenant-1', 'santri-1', 1000, 'pembelian', 'user-1'),
      ).rejects.toThrow(/Saldo tidak mencukupi/);
    });

    it('berhasil debit saat saldo cukup', async () => {
      const wallet = makeWallet(1000);
      const expectedResult = {
        walletId: 'wallet-1',
        saldoSebelum: 1000,
        saldoSesudah: 700,
        jumlah: 300,
        transactionId: 'trx-1',
      };

      mockPrisma.$transaction.mockImplementation(async (callback: any) => {
        const tx = {
          wallet: {
            findUnique: jest.fn().mockResolvedValue(wallet),
            update: jest.fn().mockResolvedValue({ ...wallet, saldo: new Decimal(700), balance: 700 }),
          },
          walletTransaction: {
            create: jest.fn().mockResolvedValue({ id: 'trx-1' }),
          },
        };
        return callback(tx);
      });

      // Mock auditLog inside transaction
      mockAuditLog.log.mockResolvedValue(undefined);

      const result = await service.debit('tenant-1', 'santri-1', 300, 'pembelian', 'user-1');
      expect(result.saldoSebelum).toBe(1000);
      expect(result.saldoSesudah).toBe(700);
      expect(result.jumlah).toBe(300);
    });

    it('melempar NotFoundException saat wallet tidak ditemukan', async () => {
      mockPrisma.$transaction.mockImplementation(async (callback: any) => {
        const tx = {
          wallet: {
            findUnique: jest.fn().mockResolvedValue(null),
            update: jest.fn(),
          },
          walletTransaction: { create: jest.fn() },
        };
        return callback(tx);
      });

      await expect(
        service.debit('tenant-1', 'santri-1', 100, 'test', 'user-1'),
      ).rejects.toThrow(NotFoundException);
    });
  });

  // ─── topUp berhasil ───────────────────────────────────────────────────────────

  describe('topUp — berhasil menambah saldo secara atomik', () => {
    it('mengembalikan saldo sesudah yang benar setelah top-up', async () => {
      const wallet = makeWallet(500);

      mockPrisma.$transaction.mockImplementation(async (callback: any) => {
        const tx = {
          wallet: {
            findUnique: jest.fn().mockResolvedValue(wallet),
            create: jest.fn(),
            update: jest.fn().mockResolvedValue({ ...wallet, saldo: new Decimal(700), balance: 700 }),
          },
          santri: { findFirst: jest.fn() },
          walletTransaction: {
            create: jest.fn().mockResolvedValue({ id: 'trx-topup-1' }),
          },
        };
        return callback(tx);
      });

      const result = await service.topUp(
        'tenant-1',
        { santriId: 'santri-1', jumlah: 200, keterangan: 'Top-up test' },
        'user-1',
      );

      expect(result.saldoSebelum).toBe(500);
      expect(result.saldoSesudah).toBe(700);
      expect(result.jumlah).toBe(200);
    });

    it('memanggil auditLog.log setelah top-up berhasil', async () => {
      const wallet = makeWallet(100);

      mockPrisma.$transaction.mockImplementation(async (callback: any) => {
        const tx = {
          wallet: {
            findUnique: jest.fn().mockResolvedValue(wallet),
            create: jest.fn(),
            update: jest.fn().mockResolvedValue({ ...wallet, saldo: new Decimal(600), balance: 600 }),
          },
          santri: { findFirst: jest.fn() },
          walletTransaction: {
            create: jest.fn().mockResolvedValue({ id: 'trx-2' }),
          },
        };
        return callback(tx);
      });

      await service.topUp(
        'tenant-1',
        { santriId: 'santri-1', jumlah: 500 },
        'user-1',
      );

      expect(mockAuditLog.log).toHaveBeenCalledWith(
        expect.objectContaining({
          aksi: 'WALLET_TOPUP',
          modul: 'wallet',
        }),
      );
    });
  });
});
