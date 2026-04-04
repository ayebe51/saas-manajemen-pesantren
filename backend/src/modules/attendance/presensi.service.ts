import {
  Injectable,
  Logger,
  NotFoundException,
  GoneException,
  ConflictException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { AuditLogService } from '../audit-log/audit-log.service';
import { QrTokenService } from './qr-token.service';
import { GpsValidatorService } from './gps-validator.service';
import { CreateSessionDto } from './dto/create-session.dto';
import { ScanAttendanceDto } from './dto/scan-attendance.dto';
import * as QRCode from 'qrcode';

@Injectable()
export class PresensiService {
  private readonly logger = new Logger(PresensiService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly auditLog: AuditLogService,
    private readonly qrTokenService: QrTokenService,
    private readonly gpsValidator: GpsValidatorService,
  ) {}

  // ─── Sessions ─────────────────────────────────────────────────────────────

  /**
   * Create a new presensi session.
   * Requirements: 5.1
   */
  async createSession(
    tenantId: string,
    userId: string,
    dto: CreateSessionDto,
  ) {
    const session = await this.prisma.presensiSession.create({
      data: {
        tenantId,
        namaSesi: dto.namaSesi,
        tipe: dto.tipe,
        lokasiLat: dto.lokasiLat ?? null,
        lokasiLng: dto.lokasiLng ?? null,
        radiusMeter: dto.radiusMeter ?? 100,
        createdBy: userId,
      },
    });

    await this.auditLog.log({
      userId,
      aksi: 'CREATE_PRESENSI_SESSION',
      modul: 'presensi',
      entitasId: session.id,
      entitasTipe: 'PresensiSession',
      nilaiAfter: { sessionId: session.id, namaSesi: session.namaSesi, tipe: session.tipe },
    });

    return session;
  }

  /**
   * Generate a QR token for a session and return QR code image data.
   * Requirements: 5.1, 5.2
   */
  async getSessionQr(tenantId: string, sessionId: string) {
    const session = await this.prisma.presensiSession.findFirst({
      where: { id: sessionId, tenantId },
    });

    if (!session) {
      throw new NotFoundException('Sesi presensi tidak ditemukan');
    }

    if (session.closedAt) {
      throw new BadRequestException('Sesi presensi sudah ditutup');
    }

    // Generate new QR token (server_timestamp based TTL)
    const { token, expiresAt } = await this.qrTokenService.generateToken(sessionId, tenantId);

    // Update session with latest QR token
    await this.prisma.presensiSession.update({
      where: { id: sessionId },
      data: { qrToken: token, qrExpiresAt: expiresAt },
    });

    // Generate QR code image as data URL
    const qrDataUrl = await QRCode.toDataURL(token);

    return {
      token,
      expiresAt,
      qrDataUrl,
      sessionId,
    };
  }

  // ─── Scan ──────────────────────────────────────────────────────────────────

  /**
   * Process a QR scan for attendance.
   *
   * Flow:
   * 1. Validate QR token (expired → 410, already used → idempotent check)
   * 2. Validate GPS coordinates
   * 3. Check idempotency (same session + santri → return existing record)
   * 4. Create presensi record with server_timestamp
   * 5. Mark QR token as used
   * 6. Log to audit log
   *
   * Requirements: 5.2, 5.3, 5.4, 5.5, 5.6, 5.7, 5.8, 5.9, 5.11
   */
  async scan(dto: ScanAttendanceDto, userId: string, ipAddress?: string) {
    // Step 1: Validate QR token — Requirement 5.2, 5.3
    const validation = await this.qrTokenService.validateToken(dto.qrToken);

    if (validation.expired) {
      // Requirement 5.3: QR expired → 410 Gone
      throw new GoneException('QR token telah kedaluwarsa');
    }

    if (!validation.valid && !validation.alreadyUsed) {
      throw new GoneException('QR token tidak valid atau telah kedaluwarsa');
    }

    const { sessionId, tenantId } = validation.payload ?? (() => {
      // If alreadyUsed, we need to find the session from the token in DB
      throw new ConflictException('QR token sudah digunakan');
    })();

    // Fetch session details for GPS validation
    const session = await this.prisma.presensiSession.findFirst({
      where: { id: sessionId, tenantId },
    });

    if (!session) {
      throw new NotFoundException('Sesi presensi tidak ditemukan');
    }

    // Step 3: Idempotency check — Requirement 5.8
    // If santri already has a record for this session, return existing record
    const existingRecord = await this.prisma.presensiRecord.findUnique({
      where: {
        sessionId_santriId: {
          sessionId,
          santriId: dto.santriId,
        },
      },
    });

    if (existingRecord) {
      this.logger.debug(`Idempotent scan: returning existing record for santri ${dto.santriId} in session ${sessionId}`);
      return { record: existingRecord, idempotent: true };
    }

    // Step 2: Validate GPS — Requirements 5.4, 5.5, 5.6
    let recordStatus = 'HADIR';
    let gpsRejectionReason: string | undefined;

    if (session.lokasiLat !== null && session.lokasiLng !== null) {
      if (dto.gpsLat === undefined || dto.gpsLng === undefined) {
        throw new BadRequestException('Koordinat GPS diperlukan untuk sesi ini');
      }

      const gpsResult = this.gpsValidator.validate({
        santriLat: dto.gpsLat,
        santriLng: dto.gpsLng,
        gpsAccuracy: dto.gpsAccuracy ?? null,
        sessionLat: Number(session.lokasiLat),
        sessionLng: Number(session.lokasiLng),
        radiusMeter: session.radiusMeter,
      });

      if (!gpsResult.accepted) {
        // Requirement 5.6: GPS di luar radius → tolak dan catat ke audit log
        recordStatus = 'DITOLAK';
        gpsRejectionReason = gpsResult.reason;
      } else if (gpsResult.pendingReview) {
        // Requirement 5.5: Akurasi GPS > 50m → PENDING_REVIEW
        recordStatus = 'PENDING_REVIEW';
      }
    }

    // Step 4: Create record with server_timestamp — Requirement 5.7
    // server_timestamp = new Date() server-side, NEVER from client payload
    const serverTimestamp = new Date();

    const record = await this.prisma.presensiRecord.create({
      data: {
        sessionId,
        santriId: dto.santriId,
        status: recordStatus,
        gpsLat: dto.gpsLat ?? null,
        gpsLng: dto.gpsLng ?? null,
        gpsAccuracy: dto.gpsAccuracy ?? null,
        serverTimestamp, // always server-side — Requirement 5.7
        clientTimestamp: dto.clientTimestamp ? new Date(dto.clientTimestamp) : null,
        faceVerified: false,
      },
    });

    // Step 5: Mark QR token as used (one-time-use) — Requirement 5.2
    if (!validation.alreadyUsed) {
      await this.qrTokenService.markTokenUsed(dto.qrToken);
    }

    // Step 6: Audit log — Requirement 5.11
    await this.auditLog.log({
      userId,
      aksi: recordStatus === 'DITOLAK' ? 'PRESENSI_DITOLAK' : 'PRESENSI_SCAN',
      modul: 'presensi',
      entitasId: record.id,
      entitasTipe: 'PresensiRecord',
      nilaiAfter: {
        sessionId,
        santriId: dto.santriId,
        status: recordStatus,
        gpsLat: dto.gpsLat,
        gpsLng: dto.gpsLng,
        gpsAccuracy: dto.gpsAccuracy,
        serverTimestamp: serverTimestamp.toISOString(),
        rejectionReason: gpsRejectionReason,
      },
      ipAddress,
    });

    return { record, idempotent: false };
  }

  // ─── Records ───────────────────────────────────────────────────────────────

  /**
   * Get all records for a session.
   * Requirements: 5.9
   */
  async getSessionRecords(tenantId: string, sessionId: string) {
    const session = await this.prisma.presensiSession.findFirst({
      where: { id: sessionId, tenantId },
    });

    if (!session) {
      throw new NotFoundException('Sesi presensi tidak ditemukan');
    }

    return this.prisma.presensiRecord.findMany({
      where: { sessionId },
      include: {
        santri: {
          select: { id: true, name: true, namaLengkap: true, nis: true, kelas: true },
        },
      },
      orderBy: { serverTimestamp: 'asc' },
    });
  }

  /**
   * Get attendance history for a santri.
   * Requirements: 5.9
   */
  async getSantriAttendance(
    tenantId: string,
    santriId: string,
    page = 1,
    limit = 20,
  ) {
    const santri = await this.prisma.santri.findFirst({
      where: { id: santriId, tenantId },
    });

    if (!santri) {
      throw new NotFoundException('Santri tidak ditemukan');
    }

    const skip = (page - 1) * limit;

    const [records, total] = await Promise.all([
      this.prisma.presensiRecord.findMany({
        where: { santriId },
        include: {
          session: {
            select: { id: true, namaSesi: true, tipe: true, createdAt: true },
          },
        },
        orderBy: { serverTimestamp: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.presensiRecord.count({ where: { santriId } }),
    ]);

    return {
      data: records,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }
}
