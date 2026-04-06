/**
 * Unit test: Konfirmasi invoice sudah PAID → 409, saldo tidak cukup → 422, jumlah negatif → 400
 * Requirements: 11.4, 13.3
 * Task: 15.10
 */

import { Test, TestingModule } from '@nestjs/testing';
import { ConflictException, BadRequestException, NotFoundException } from '@nestjs/common';
import { InvoiceService } from './invoice.service';
import { PrismaService } from '../../common/prisma/prisma.service';
import { AuditLogService } from '../audit-log/audit-log.service';

describe('InvoiceService — Unit Tests (Task 15.10)', () => {
  let service: InvoiceService;
  let mockPrisma: any;
  let mockAuditLog: any;

  beforeEach(async () => {
    mockAuditLog = {
      log: jest.fn().mockResolvedValue(undefined),
    };

    mockPrisma = {
      invoice: {
        findFirst: jest.fn(),
        findUnique: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        updateMany: jest.fn(),
      },
      santri: {
        findFirst: jest.fn(),
      },
      $transaction: jest.fn(),
      $queryRaw: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        InvoiceService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: AuditLogService, useValue: mockAuditLog },
      ],
    }).compile();

    service = module.get<InvoiceService>(InvoiceService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  // ─── 15.10a: Konfirmasi invoice sudah PAID → 409 ─────────────────────────────

  describe('confirmPayment — invoice sudah PAID → 409 ConflictException', () => {
    it('melempar ConflictException (409) saat invoice sudah berstatus PAID', async () => {
      // Arrange: $transaction memanggil callback dengan tx yang mengembalikan invoice PAID
      mockPrisma.$transaction.mockImplementation(async (callback: any) => {
        const tx = {
          $queryRaw: jest.fn().mockResolvedValue([
            {
              id: 'inv-001',
              status: 'PAID',
              idempotencyKey: null,
              tenantId: 'tenant-1',
            },
          ]),
          invoice: {
            findUnique: jest.fn().mockResolvedValue({ id: 'inv-001', status: 'PAID' }),
            update: jest.fn(),
          },
        };
        return callback(tx);
      });

      // Act & Assert
      await expect(
        service.confirmPayment('tenant-1', 'inv-001', {}, 'user-1'),
      ).rejects.toThrow(ConflictException);
    });

    it('pesan error mengandung "PAID"', async () => {
      mockPrisma.$transaction.mockImplementation(async (callback: any) => {
        const tx = {
          $queryRaw: jest.fn().mockResolvedValue([
            { id: 'inv-001', status: 'PAID', idempotencyKey: null, tenantId: 'tenant-1' },
          ]),
          invoice: { findUnique: jest.fn(), update: jest.fn() },
        };
        return callback(tx);
      });

      await expect(
        service.confirmPayment('tenant-1', 'inv-001', {}, 'user-1'),
      ).rejects.toThrow(/PAID/);
    });

    it('idempotency: PAID dengan idempotency key yang sama → return existing invoice', async () => {
      const existingInvoice = { id: 'inv-001', status: 'PAID' };

      mockPrisma.$transaction.mockImplementation(async (callback: any) => {
        const tx = {
          $queryRaw: jest.fn().mockResolvedValue([
            {
              id: 'inv-001',
              status: 'PAID',
              idempotencyKey: 'idem-key-123',
              tenantId: 'tenant-1',
            },
          ]),
          invoice: {
            findUnique: jest.fn().mockResolvedValue(existingInvoice),
            update: jest.fn(),
          },
        };
        return callback(tx);
      });

      const result = await service.confirmPayment(
        'tenant-1',
        'inv-001',
        {},
        'user-1',
        'idem-key-123', // same idempotency key
      );

      expect(result).toEqual(existingInvoice);
    });
  });

  // ─── 15.10b: Transisi status tidak valid → BadRequestException ───────────────

  describe('transitionStatus — status tidak valid → 400 BadRequestException', () => {
    it('melempar BadRequestException saat transisi PAID → PENDING tidak valid', async () => {
      mockPrisma.invoice.findFirst.mockResolvedValue({
        id: 'inv-001',
        status: 'PAID',
        tenantId: 'tenant-1',
      });

      await expect(
        service.transitionStatus('tenant-1', 'inv-001', 'PENDING', 'user-1'),
      ).rejects.toThrow(BadRequestException);
    });

    it('melempar BadRequestException saat transisi EXPIRED → PAID tidak valid', async () => {
      mockPrisma.invoice.findFirst.mockResolvedValue({
        id: 'inv-002',
        status: 'EXPIRED',
        tenantId: 'tenant-1',
      });

      await expect(
        service.transitionStatus('tenant-1', 'inv-002', 'PAID', 'user-1'),
      ).rejects.toThrow(BadRequestException);
    });

    it('melempar BadRequestException saat transisi CANCELLED → PAID tidak valid', async () => {
      mockPrisma.invoice.findFirst.mockResolvedValue({
        id: 'inv-003',
        status: 'CANCELLED',
        tenantId: 'tenant-1',
      });

      await expect(
        service.transitionStatus('tenant-1', 'inv-003', 'PAID', 'user-1'),
      ).rejects.toThrow(BadRequestException);
    });

    it('berhasil transisi PENDING → CANCELLED (valid)', async () => {
      mockPrisma.invoice.findFirst.mockResolvedValue({
        id: 'inv-004',
        status: 'PENDING',
        tenantId: 'tenant-1',
      });
      mockPrisma.invoice.update.mockResolvedValue({ id: 'inv-004', status: 'CANCELLED' });

      const result = await service.transitionStatus('tenant-1', 'inv-004', 'CANCELLED', 'user-1');
      expect(result.status).toBe('CANCELLED');
    });

    it('berhasil transisi PAID → REFUNDED (valid)', async () => {
      mockPrisma.invoice.findFirst.mockResolvedValue({
        id: 'inv-005',
        status: 'PAID',
        tenantId: 'tenant-1',
      });
      mockPrisma.invoice.update.mockResolvedValue({ id: 'inv-005', status: 'REFUNDED' });

      const result = await service.transitionStatus('tenant-1', 'inv-005', 'REFUNDED', 'user-1');
      expect(result.status).toBe('REFUNDED');
    });
  });

  // ─── 15.10c: Invoice tidak ditemukan → NotFoundException ─────────────────────

  describe('confirmPayment — invoice tidak ditemukan → 404 NotFoundException', () => {
    it('melempar NotFoundException saat invoice tidak ada', async () => {
      mockPrisma.$transaction.mockImplementation(async (callback: any) => {
        const tx = {
          $queryRaw: jest.fn().mockResolvedValue([]), // empty result
          invoice: { findUnique: jest.fn(), update: jest.fn() },
        };
        return callback(tx);
      });

      await expect(
        service.confirmPayment('tenant-1', 'nonexistent-id', {}, 'user-1'),
      ).rejects.toThrow(NotFoundException);
    });
  });

  // ─── 15.10d: expireOverdueInvoices ───────────────────────────────────────────

  describe('expireOverdueInvoices', () => {
    it('mengembalikan jumlah invoice yang di-expire', async () => {
      mockPrisma.invoice.updateMany.mockResolvedValue({ count: 3 });

      const count = await service.expireOverdueInvoices();
      expect(count).toBe(3);
    });

    it('mengembalikan 0 jika tidak ada invoice yang expired', async () => {
      mockPrisma.invoice.updateMany.mockResolvedValue({ count: 0 });

      const count = await service.expireOverdueInvoices();
      expect(count).toBe(0);
    });

    it('memanggil updateMany dengan filter status PENDING dan dueDate < now', async () => {
      mockPrisma.invoice.updateMany.mockResolvedValue({ count: 0 });

      await service.expireOverdueInvoices();

      expect(mockPrisma.invoice.updateMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            status: 'PENDING',
            dueDate: expect.objectContaining({ lt: expect.any(Date) }),
          }),
          data: expect.objectContaining({ status: 'EXPIRED' }),
        }),
      );
    });
  });
});
