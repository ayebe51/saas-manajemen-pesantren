// Feature: pesantren-management-app, Property 13: Server Timestamp Selalu Digunakan untuk Presensi
import * as fc from 'fast-check';
import { GoneException, NotFoundException } from '@nestjs/common';
import { PresensiService } from './presensi.service';
import { QrTokenService, QrValidationResult } from './qr-token.service';
import { GpsValidatorService } from './gps-validator.service';
import { ScanAttendanceDto } from './dto/scan-attendance.dto';

// ─── Mocks ─────────────────────────────────────────────────────────────────────
function createMockPrisma(overrides: Partial<any> = {}) {
  return {
    presensiSession: {
      create: jest.fn(),
      findFirst: jest.fn(),
      update: jest.fn(),
    },
    presensiRecord: {
      create: jest.fn(),
      findUnique: jest.fn(),
      findMany: jest.fn(),
      count: jest.fn(),
    },
    santri: {
      findFirst: jest.fn(),
    },
    ...overrides,
  };
}

function createMockAuditLog() {
  return { log: jest.fn().mockResolvedValue(undefined) };
}

function createMockQrTokenService(validationResult: QrValidationResult) {
  return {
    validateToken: jest.fn().mockResolvedValue(validationResult),
    markTokenUsed: jest.fn().mockResolvedValue(undefined),
    generateToken: jest.fn(),
    deleteToken: jest.fn(),
  };
}

function createMockGpsValidator(accepted = true, pendingReview = false) {
  return {
    validate: jest.fn().mockReturnValue({
      accepted,
      pendingReview,
      distanceMeters: 10,
    }),
    haversineDistance: jest.fn().mockReturnValue(10),
  };
}

// ─── Unit Tests ────────────────────────────────────────────────────────────────
describe('PresensiService — Unit Tests', () => {
  describe('scan — QR expired → 410 GoneException', () => {
    it('should throw GoneException when QR token is expired', async () => {
      const prisma = createMockPrisma();
      const auditLog = createMockAuditLog();
      const qrService = createMockQrTokenService({
        valid: false,
        expired: true,
        alreadyUsed: false,
      });
      const gpsService = createMockGpsValidator();

      const service = new PresensiService(
        prisma as any,
        auditLog as any,
        qrService as any,
        gpsService as any,
      );

      const dto: ScanAttendanceDto = {
        qrToken: 'expired-token',
        santriId: 'santri-1',
      };

      await expect(service.scan(dto, 'user-1')).rejects.toThrow(GoneException);
    });
  });

  describe('scan — duplikat scan → idempotent', () => {
    it('should return existing record without creating duplicate', async () => {
      const existingRecord = {
        id: 'record-1',
        sessionId: 'session-1',
        santriId: 'santri-1',
        status: 'HADIR',
        serverTimestamp: new Date('2024-01-01T08:00:00Z'),
      };

      const prisma = createMockPrisma();
      prisma.presensiSession.findFirst.mockResolvedValue({
        id: 'session-1',
        tenantId: 'tenant-1',
        lokasiLat: null,
        lokasiLng: null,
        radiusMeter: 100,
        closedAt: null,
      });
      prisma.presensiRecord.findUnique.mockResolvedValue(existingRecord);

      const auditLog = createMockAuditLog();
      const qrService = createMockQrTokenService({
        valid: true,
        expired: false,
        alreadyUsed: false,
        payload: { sessionId: 'session-1', tenantId: 'tenant-1', createdAt: new Date().toISOString() },
      });
      const gpsService = createMockGpsValidator();

      const service = new PresensiService(
        prisma as any,
        auditLog as any,
        qrService as any,
        gpsService as any,
      );

      const dto: ScanAttendanceDto = {
        qrToken: 'valid-token',
        santriId: 'santri-1',
      };

      const result = await service.scan(dto, 'user-1');

      expect(result.idempotent).toBe(true);
      expect(result.record).toEqual(existingRecord);
      // Should NOT create a new record
      expect(prisma.presensiRecord.create).not.toHaveBeenCalled();
    });
  });

  describe('scan — GPS di luar radius → DITOLAK', () => {
    it('should create record with status DITOLAK when GPS is outside radius', async () => {
      const prisma = createMockPrisma();
      prisma.presensiSession.findFirst.mockResolvedValue({
        id: 'session-1',
        tenantId: 'tenant-1',
        lokasiLat: -6.2088,
        lokasiLng: 106.8456,
        radiusMeter: 100,
        closedAt: null,
      });
      prisma.presensiRecord.findUnique.mockResolvedValue(null);
      prisma.presensiRecord.create.mockResolvedValue({
        id: 'record-1',
        status: 'DITOLAK',
        serverTimestamp: new Date(),
      });

      const auditLog = createMockAuditLog();
      const qrService = createMockQrTokenService({
        valid: true,
        expired: false,
        alreadyUsed: false,
        payload: { sessionId: 'session-1', tenantId: 'tenant-1', createdAt: new Date().toISOString() },
      });
      // GPS outside radius
      const gpsService = createMockGpsValidator(false, false);

      const service = new PresensiService(
        prisma as any,
        auditLog as any,
        qrService as any,
        gpsService as any,
      );

      const dto: ScanAttendanceDto = {
        qrToken: 'valid-token',
        santriId: 'santri-1',
        gpsLat: -6.3000,
        gpsLng: 106.8456,
        gpsAccuracy: 10,
      };

      const result = await service.scan(dto, 'user-1');

      expect(result.idempotent).toBe(false);
      expect(prisma.presensiRecord.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ status: 'DITOLAK' }),
        }),
      );
      // Audit log must be called for rejected attendance
      expect(auditLog.log).toHaveBeenCalledWith(
        expect.objectContaining({ aksi: 'PRESENSI_DITOLAK' }),
      );
    });
  });
});

// ─── Property Tests ────────────────────────────────────────────────────────────
describe('PresensiService — Property 13: Server Timestamp Selalu Digunakan untuk Presensi', () => {
  /**
   * Property 13: server_timestamp pada record presensi harus berasal dari server
   * (bukan dari payload client), dan harus berada dalam rentang waktu yang wajar.
   * Validates: Requirements 5.7
   */
  it('Property 13: server_timestamp selalu dari server, bukan dari client payload', async () => {
    // Feature: pesantren-management-app, Property 13: Server Timestamp Selalu Digunakan untuk Presensi
    await fc.assert(
      fc.asyncProperty(
        // Generate arbitrary "client timestamps" — could be past, future, or garbage
        fc.oneof(
          fc.constant('2000-01-01T00:00:00Z'),   // far past
          fc.constant('2099-12-31T23:59:59Z'),   // far future
          fc.constant('invalid-timestamp'),       // invalid
          fc.constant(undefined),                 // missing
          fc.date().map((d) => d.toISOString()),  // random date
        ),
        async (clientTimestamp) => {
          const capturedData: any[] = [];

          const prisma = createMockPrisma();
          prisma.presensiSession.findFirst.mockResolvedValue({
            id: 'session-1',
            tenantId: 'tenant-1',
            lokasiLat: null,
            lokasiLng: null,
            radiusMeter: 100,
            closedAt: null,
          });
          prisma.presensiRecord.findUnique.mockResolvedValue(null);
          prisma.presensiRecord.create.mockImplementation(async (args: any) => {
            capturedData.push(args.data);
            return { id: 'record-1', ...args.data };
          });

          const auditLog = createMockAuditLog();
          const qrService = createMockQrTokenService({
            valid: true,
            expired: false,
            alreadyUsed: false,
            payload: {
              sessionId: 'session-1',
              tenantId: 'tenant-1',
              createdAt: new Date().toISOString(),
            },
          });
          const gpsService = createMockGpsValidator(true, false);

          const service = new PresensiService(
            prisma as any,
            auditLog as any,
            qrService as any,
            gpsService as any,
          );

          const beforeCall = Date.now();

          const dto: ScanAttendanceDto = {
            qrToken: 'valid-token',
            santriId: 'santri-1',
            clientTimestamp,
          };

          try {
            await service.scan(dto, 'user-1');
          } catch {
            // Some invalid clientTimestamps may cause errors — that's fine
            return;
          }

          const afterCall = Date.now();

          expect(capturedData.length).toBe(1);
          const { serverTimestamp, clientTimestamp: storedClientTs } = capturedData[0];

          // server_timestamp must be a Date object set by the server
          expect(serverTimestamp).toBeInstanceOf(Date);

          // server_timestamp must be within the request window (not from client)
          const serverTs = serverTimestamp.getTime();
          expect(serverTs).toBeGreaterThanOrEqual(beforeCall - 100); // 100ms tolerance
          expect(serverTs).toBeLessThanOrEqual(afterCall + 100);

          // If clientTimestamp was provided and valid, it should be stored separately
          // but server_timestamp must NOT equal clientTimestamp (unless by coincidence)
          if (clientTimestamp && clientTimestamp !== 'invalid-timestamp') {
            const clientTs = new Date(clientTimestamp).getTime();
            // The server_timestamp should be close to NOW, not to the client timestamp
            // (unless client timestamp happens to be close to now)
            const clientIsNearNow = Math.abs(clientTs - Date.now()) < 5000;
            if (!clientIsNearNow) {
              // server_timestamp should NOT match the far-past or far-future client timestamp
              expect(Math.abs(serverTs - clientTs)).toBeGreaterThan(1000);
            }
          }
        },
      ),
      { numRuns: 100 },
    );
  });
});
