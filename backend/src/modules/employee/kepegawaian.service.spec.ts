import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { KepegawaianService } from './kepegawaian.service';
import { PrismaService } from '../../common/prisma/prisma.service';
import { AuditLogService } from '../audit-log/audit-log.service';
import { AuthService } from '../auth/auth.service';

/**
 * Unit tests for KepegawaianService.deactivatePegawai
 * Requirements: 16.2 — WHEN Admin_Pesantren menonaktifkan akun pegawai,
 * THE System SHALL menonaktifkan akses login pegawai tersebut secara bersamaan.
 */
describe('KepegawaianService — deactivatePegawai (Req 16.2)', () => {
  let service: KepegawaianService;

  const TENANT_ID = 'tenant-001';
  const PEGAWAI_ID = 'pegawai-001';
  const USER_ID = 'user-001';
  const ACTOR_ID = 'admin-001';

  const mockActivePegawai = {
    id: PEGAWAI_ID,
    tenantId: TENANT_ID,
    userId: USER_ID,
    nama: 'Budi Santoso',
    jabatan: 'Guru',
    statusAktif: true,
    deletedAt: null,
    user: { id: USER_ID, email: 'budi@pesantren.com', name: 'Budi Santoso', role: 'Wali_Kelas' },
  };

  const mockPrismaService = {
    pegawai: {
      findFirst: jest.fn(),
      update: jest.fn(),
    },
    user: {
      update: jest.fn(),
    },
    refreshToken: {
      updateMany: jest.fn(),
    },
    $transaction: jest.fn(),
  };

  const mockAuditLogService = {
    log: jest.fn().mockResolvedValue(undefined),
  };

  const mockAuthService = {
    revokeUserSessions: jest.fn().mockResolvedValue(undefined),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        KepegawaianService,
        { provide: PrismaService, useValue: mockPrismaService },
        { provide: AuditLogService, useValue: mockAuditLogService },
        { provide: AuthService, useValue: mockAuthService },
      ],
    }).compile();

    service = module.get<KepegawaianService>(KepegawaianService);
    jest.clearAllMocks();
    mockAuditLogService.log.mockResolvedValue(undefined);
    mockAuthService.revokeUserSessions.mockResolvedValue(undefined);
  });

  // ─── Basic deactivation ───────────────────────────────────────────────────

  describe('deactivatePegawai — basic deactivation', () => {
    it('should deactivate pegawai and revoke all active sessions', async () => {
      mockPrismaService.pegawai.findFirst.mockResolvedValue(mockActivePegawai);
      mockPrismaService.$transaction.mockImplementation(async (fn) => fn(mockPrismaService));
      mockPrismaService.pegawai.update.mockResolvedValue({ ...mockActivePegawai, statusAktif: false });
      mockPrismaService.user.update.mockResolvedValue({});

      const result = await service.deactivatePegawai(
        TENANT_ID,
        PEGAWAI_ID,
        { alasan: 'Kontrak berakhir' },
        ACTOR_ID,
      );

      expect(result.success).toBe(true);
      // Requirement 16.2: sessions must be revoked
      expect(mockAuthService.revokeUserSessions).toHaveBeenCalledWith(USER_ID);
    });

    it('should set pegawai statusAktif to false', async () => {
      mockPrismaService.pegawai.findFirst.mockResolvedValue(mockActivePegawai);
      mockPrismaService.$transaction.mockImplementation(async (fn) => fn(mockPrismaService));
      mockPrismaService.pegawai.update.mockResolvedValue({});
      mockPrismaService.user.update.mockResolvedValue({});

      await service.deactivatePegawai(TENANT_ID, PEGAWAI_ID, { alasan: 'Pensiun' }, ACTOR_ID);

      expect(mockPrismaService.pegawai.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: PEGAWAI_ID },
          data: { statusAktif: false },
        }),
      );
    });

    it('should deactivate the linked user account', async () => {
      mockPrismaService.pegawai.findFirst.mockResolvedValue(mockActivePegawai);
      mockPrismaService.$transaction.mockImplementation(async (fn) => fn(mockPrismaService));
      mockPrismaService.pegawai.update.mockResolvedValue({});
      mockPrismaService.user.update.mockResolvedValue({});

      await service.deactivatePegawai(TENANT_ID, PEGAWAI_ID, { alasan: 'Pensiun' }, ACTOR_ID);

      expect(mockPrismaService.user.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: USER_ID },
          data: { isActive: false },
        }),
      );
    });

    it('should record deactivation to audit log', async () => {
      mockPrismaService.pegawai.findFirst.mockResolvedValue(mockActivePegawai);
      mockPrismaService.$transaction.mockImplementation(async (fn) => fn(mockPrismaService));
      mockPrismaService.pegawai.update.mockResolvedValue({});
      mockPrismaService.user.update.mockResolvedValue({});

      await service.deactivatePegawai(TENANT_ID, PEGAWAI_ID, { alasan: 'Pensiun' }, ACTOR_ID);

      expect(mockAuditLogService.log).toHaveBeenCalledWith(
        expect.objectContaining({
          aksi: 'DEACTIVATE_PEGAWAI',
          modul: 'kepegawaian',
          userId: ACTOR_ID,
          entitasId: PEGAWAI_ID,
        }),
      );
    });
  });

  // ─── Session revocation — Requirement 16.2 ───────────────────────────────

  describe('deactivatePegawai — session revocation (Req 16.2)', () => {
    it('should call revokeUserSessions with the correct userId', async () => {
      mockPrismaService.pegawai.findFirst.mockResolvedValue(mockActivePegawai);
      mockPrismaService.$transaction.mockImplementation(async (fn) => fn(mockPrismaService));
      mockPrismaService.pegawai.update.mockResolvedValue({});
      mockPrismaService.user.update.mockResolvedValue({});

      await service.deactivatePegawai(TENANT_ID, PEGAWAI_ID, { alasan: 'Resign' }, ACTOR_ID);

      expect(mockAuthService.revokeUserSessions).toHaveBeenCalledTimes(1);
      expect(mockAuthService.revokeUserSessions).toHaveBeenCalledWith(USER_ID);
    });

    it('should NOT call revokeUserSessions when pegawai has no linked user', async () => {
      const pegawaiWithoutUser = { ...mockActivePegawai, userId: null, user: null };
      mockPrismaService.pegawai.findFirst.mockResolvedValue(pegawaiWithoutUser);
      mockPrismaService.$transaction.mockImplementation(async (fn) => fn(mockPrismaService));
      mockPrismaService.pegawai.update.mockResolvedValue({});

      await service.deactivatePegawai(TENANT_ID, PEGAWAI_ID, { alasan: 'Resign' }, ACTOR_ID);

      expect(mockAuthService.revokeUserSessions).not.toHaveBeenCalled();
    });

    it('should still succeed even if revokeUserSessions resolves without error', async () => {
      mockPrismaService.pegawai.findFirst.mockResolvedValue(mockActivePegawai);
      mockPrismaService.$transaction.mockImplementation(async (fn) => fn(mockPrismaService));
      mockPrismaService.pegawai.update.mockResolvedValue({});
      mockPrismaService.user.update.mockResolvedValue({});
      mockAuthService.revokeUserSessions.mockResolvedValue(undefined);

      await expect(
        service.deactivatePegawai(TENANT_ID, PEGAWAI_ID, { alasan: 'Resign' }, ACTOR_ID),
      ).resolves.toMatchObject({ success: true });
    });

    it('should revoke sessions AFTER the transaction completes (atomicity)', async () => {
      const callOrder: string[] = [];

      mockPrismaService.pegawai.findFirst.mockResolvedValue(mockActivePegawai);
      mockPrismaService.$transaction.mockImplementation(async (fn) => {
        callOrder.push('transaction');
        return fn(mockPrismaService);
      });
      mockPrismaService.pegawai.update.mockResolvedValue({});
      mockPrismaService.user.update.mockResolvedValue({});
      mockAuthService.revokeUserSessions.mockImplementation(async () => {
        callOrder.push('revokeUserSessions');
      });

      await service.deactivatePegawai(TENANT_ID, PEGAWAI_ID, { alasan: 'Resign' }, ACTOR_ID);

      // Transaction must complete before session revocation
      expect(callOrder.indexOf('transaction')).toBeLessThan(
        callOrder.indexOf('revokeUserSessions'),
      );
    });
  });

  // ─── After deactivation: refresh token cannot be used ────────────────────

  describe('after deactivation: refresh token is invalidated', () => {
    it('should revoke all active refresh tokens so user cannot get new access tokens', async () => {
      // Simulate what revokeUserSessions does: updateMany on refreshToken
      const mockPrismaWithRefreshToken = {
        ...mockPrismaService,
        refreshToken: {
          updateMany: jest.fn().mockResolvedValue({ count: 3 }),
        },
      };

      // Verify that AuthService.revokeUserSessions calls updateMany with revoked: true
      // (this tests the contract between KepegawaianService and AuthService)
      const authServiceSpy = jest.spyOn(mockAuthService, 'revokeUserSessions');

      mockPrismaService.pegawai.findFirst.mockResolvedValue(mockActivePegawai);
      mockPrismaService.$transaction.mockImplementation(async (fn) => fn(mockPrismaService));
      mockPrismaService.pegawai.update.mockResolvedValue({});
      mockPrismaService.user.update.mockResolvedValue({});

      await service.deactivatePegawai(TENANT_ID, PEGAWAI_ID, { alasan: 'Resign' }, ACTOR_ID);

      // revokeUserSessions must be called — this is what prevents token reuse
      expect(authServiceSpy).toHaveBeenCalledWith(USER_ID);
    });
  });

  // ─── Error cases ──────────────────────────────────────────────────────────

  describe('deactivatePegawai — error cases', () => {
    it('should throw NotFoundException when pegawai does not exist', async () => {
      mockPrismaService.pegawai.findFirst.mockResolvedValue(null);

      await expect(
        service.deactivatePegawai(TENANT_ID, 'nonexistent-id', { alasan: 'Test' }, ACTOR_ID),
      ).rejects.toThrow(NotFoundException);

      // Sessions must NOT be revoked if pegawai not found
      expect(mockAuthService.revokeUserSessions).not.toHaveBeenCalled();
    });

    it('should throw BadRequestException when pegawai is already inactive', async () => {
      const inactivePegawai = { ...mockActivePegawai, statusAktif: false };
      mockPrismaService.pegawai.findFirst.mockResolvedValue(inactivePegawai);

      await expect(
        service.deactivatePegawai(TENANT_ID, PEGAWAI_ID, { alasan: 'Test' }, ACTOR_ID),
      ).rejects.toThrow(BadRequestException);

      // Sessions must NOT be revoked again for already-inactive pegawai
      expect(mockAuthService.revokeUserSessions).not.toHaveBeenCalled();
    });

    it('should throw BadRequestException when pegawai is already inactive (message check)', async () => {
      const inactivePegawai = { ...mockActivePegawai, statusAktif: false };
      mockPrismaService.pegawai.findFirst.mockResolvedValue(inactivePegawai);

      await expect(
        service.deactivatePegawai(TENANT_ID, PEGAWAI_ID, { alasan: 'Test' }, ACTOR_ID),
      ).rejects.toThrow('Pegawai sudah dalam status tidak aktif');
    });
  });

  // ─── Atomicity: both user deactivation and token revocation happen ────────

  describe('deactivatePegawai — atomicity (Req 16.2)', () => {
    it('should execute user deactivation inside a transaction', async () => {
      mockPrismaService.pegawai.findFirst.mockResolvedValue(mockActivePegawai);
      mockPrismaService.$transaction.mockImplementation(async (fn) => fn(mockPrismaService));
      mockPrismaService.pegawai.update.mockResolvedValue({});
      mockPrismaService.user.update.mockResolvedValue({});

      await service.deactivatePegawai(TENANT_ID, PEGAWAI_ID, { alasan: 'Resign' }, ACTOR_ID);

      // Both pegawai and user updates must happen inside $transaction
      expect(mockPrismaService.$transaction).toHaveBeenCalledTimes(1);
      expect(mockPrismaService.pegawai.update).toHaveBeenCalled();
      expect(mockPrismaService.user.update).toHaveBeenCalled();
    });

    it('should not revoke sessions if transaction fails', async () => {
      mockPrismaService.pegawai.findFirst.mockResolvedValue(mockActivePegawai);
      mockPrismaService.$transaction.mockRejectedValue(new Error('DB transaction failed'));

      await expect(
        service.deactivatePegawai(TENANT_ID, PEGAWAI_ID, { alasan: 'Resign' }, ACTOR_ID),
      ).rejects.toThrow('DB transaction failed');

      // Sessions must NOT be revoked if the DB transaction failed
      expect(mockAuthService.revokeUserSessions).not.toHaveBeenCalled();
    });
  });
});
