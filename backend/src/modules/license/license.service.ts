import { Injectable, Logger, HttpException, HttpStatus } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import { PrismaService } from '../../common/prisma/prisma.service';
import { AuditLogService } from '../audit-log/audit-log.service';
import * as crypto from 'crypto';
import * as os from 'os';
import { firstValueFrom } from 'rxjs';
import { LicenseStatusDto } from './dto/license-status.dto';

export type LicenseStatus = 'INACTIVE' | 'ACTIVE' | 'GRACE_PERIOD' | 'EXPIRED' | 'REVOKED';

@Injectable()
export class LicenseService {
  private readonly logger = new Logger(LicenseService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
    private readonly httpService: HttpService,
    private readonly auditLogService: AuditLogService,
  ) {}

  // ─── Hardware Fingerprint ────────────────────────────────────────────────────

  /**
   * Generate SHA-256 hardware fingerprint from hostname + MAC + CPU model.
   * Requirements: 19.5
   */
  generateHardwareFingerprint(): string {
    const hostname = os.hostname();
    const cpuModel = os.cpus()[0]?.model ?? 'unknown-cpu';
    const mac = this.getPrimaryMacAddress();

    const raw = [hostname, mac, cpuModel].join('|');
    return crypto.createHash('sha256').update(raw).digest('hex');
  }

  private getPrimaryMacAddress(): string {
    const interfaces = os.networkInterfaces();
    for (const iface of Object.values(interfaces)) {
      if (!iface) continue;
      for (const entry of iface) {
        if (!entry.internal && entry.mac && entry.mac !== '00:00:00:00:00:00') {
          return entry.mac;
        }
      }
    }
    return '00:00:00:00:00:00';
  }

  // ─── Encryption helpers ──────────────────────────────────────────────────────

  private getEncryptionKey(): Buffer {
    const envKey = this.configService.get<string>('LICENSE_ENCRYPTION_KEY');
    const raw = envKey ?? this.generateHardwareFingerprint();
    // Derive a 32-byte key via SHA-256
    return crypto.createHash('sha256').update(raw).digest();
  }

  private encrypt(plaintext: string): string {
    const key = this.getEncryptionKey();
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv('aes-256-cbc', key, iv);
    const encrypted = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()]);
    return iv.toString('hex') + ':' + encrypted.toString('hex');
  }

  private decrypt(ciphertext: string): string {
    const [ivHex, encHex] = ciphertext.split(':');
    const key = this.getEncryptionKey();
    const iv = Buffer.from(ivHex, 'hex');
    const enc = Buffer.from(encHex, 'hex');
    const decipher = crypto.createDecipheriv('aes-256-cbc', key, iv);
    return Buffer.concat([decipher.update(enc), decipher.final()]).toString('utf8');
  }

  // ─── Activation ──────────────────────────────────────────────────────────────

  /**
   * Online activation: call license server, store encrypted proof locally.
   * Requirements: 19.1, 19.2, 19.5
   */
  async activateLicense(licenseKey: string): Promise<LicenseStatusDto> {
    const fingerprint = this.generateHardwareFingerprint();
    const serverUrl = this.configService.get<string>('LICENSE_SERVER_URL');

    let serverResponse: any = null;

    try {
      const response = await firstValueFrom(
        this.httpService.post(`${serverUrl}/api/activate`, {
          licenseKey,
          hardwareFingerprint: fingerprint,
        }),
      );
      serverResponse = response.data;
    } catch (err) {
      this.logger.error(`License server activation failed: ${err.message}`);
      throw new HttpException(
        'Unable to reach license server. Please check your internet connection.',
        HttpStatus.SERVICE_UNAVAILABLE,
      );
    }

    if (!serverResponse?.success) {
      throw new HttpException(
        serverResponse?.message ?? 'License activation rejected by server.',
        HttpStatus.UNPROCESSABLE_ENTITY,
      );
    }

    // Encrypt and store activation proof locally — Requirement 19.2
    const proof = this.encrypt(JSON.stringify({ licenseKey, fingerprint, activatedAt: new Date().toISOString() }));
    const now = new Date();

    const existing = await this.prisma.license.findFirst();

    let license: any;
    if (existing) {
      license = await this.prisma.license.update({
        where: { id: existing.id },
        data: {
          licenseKey,
          hardwareFingerprint: fingerprint,
          activatedAt: now,
          lastVerifiedAt: now,
          status: 'ACTIVE',
          metadata: { encryptedProof: proof, serverResponse },
        },
      });
    } else {
      license = await this.prisma.license.create({
        data: {
          licenseKey,
          hardwareFingerprint: fingerprint,
          activatedAt: now,
          lastVerifiedAt: now,
          status: 'ACTIVE',
          metadata: { encryptedProof: proof, serverResponse },
        },
      });
    }

    // Audit log — Requirement 19.6
    await this.auditLogService.log({
      aksi: 'LICENSE_ACTIVATED',
      modul: 'license',
      entitasId: license.id,
      metadata: { licenseKey, fingerprint, status: 'ACTIVE' },
    });

    return this.buildStatusDto(license);
  }

  // ─── Verification ────────────────────────────────────────────────────────────

  /**
   * Verify license: try online first, fall back to local/grace period.
   * Requirements: 19.3, 19.4, 19.6
   */
  async verifyLicense(): Promise<LicenseStatusDto> {
    const license = await this.prisma.license.findFirst();

    if (!license || license.status === 'INACTIVE') {
      return this.buildStatusDtoFromValues('INACTIVE', null);
    }

    if (license.status === 'REVOKED') {
      return this.buildStatusDtoFromValues('REVOKED', license);
    }

    // Try online verification
    const onlineStatus = await this.tryOnlineVerification(license);
    if (onlineStatus) {
      return onlineStatus;
    }

    // Offline fallback — check grace period — Requirement 19.3
    return this.evaluateGracePeriod(license);
  }

  private async tryOnlineVerification(license: any): Promise<LicenseStatusDto | null> {
    const serverUrl = this.configService.get<string>('LICENSE_SERVER_URL');
    if (!serverUrl) return null;

    try {
      const fingerprint = this.generateHardwareFingerprint();
      const response = await firstValueFrom(
        this.httpService.post(`${serverUrl}/api/verify`, {
          licenseKey: license.licenseKey,
          hardwareFingerprint: fingerprint,
        }),
      );

      const data = response.data;
      const newStatus: LicenseStatus = data?.status ?? 'ACTIVE';
      const now = new Date();

      const updated = await this.prisma.license.update({
        where: { id: license.id },
        data: { lastVerifiedAt: now, status: newStatus },
      });

      // Audit log — Requirement 19.6
      await this.auditLogService.log({
        aksi: 'LICENSE_VERIFIED_ONLINE',
        modul: 'license',
        entitasId: license.id,
        metadata: { status: newStatus, timestamp: now.toISOString() },
      });

      return this.buildStatusDto(updated);
    } catch (err) {
      this.logger.warn(`Online license verification failed (offline mode): ${err.message}`);
      return null;
    }
  }

  private async evaluateGracePeriod(license: any): Promise<LicenseStatusDto> {
    const lastVerified = license.lastVerifiedAt ? new Date(license.lastVerifiedAt) : null;
    const graceDays = license.gracePeriodDays ?? 30;

    if (!lastVerified) {
      // Never verified online — treat as expired
      const updated = await this.prisma.license.update({
        where: { id: license.id },
        data: { status: 'EXPIRED' },
      });
      await this.logVerification(license.id, 'EXPIRED');
      return this.buildStatusDto(updated);
    }

    const now = new Date();
    const diffMs = now.getTime() - lastVerified.getTime();
    const diffDays = diffMs / (1000 * 60 * 60 * 24);

    if (diffDays <= graceDays) {
      // Within grace period — Requirement 19.3
      const updated = await this.prisma.license.update({
        where: { id: license.id },
        data: { status: 'GRACE_PERIOD' },
      });
      await this.logVerification(license.id, 'GRACE_PERIOD');
      return this.buildStatusDto(updated);
    } else {
      // Grace period expired — Requirement 19.4
      const updated = await this.prisma.license.update({
        where: { id: license.id },
        data: { status: 'EXPIRED' },
      });
      await this.logVerification(license.id, 'EXPIRED');
      return this.buildStatusDto(updated);
    }
  }

  private async logVerification(licenseId: string, status: string): Promise<void> {
    await this.auditLogService.log({
      aksi: 'LICENSE_VERIFIED_OFFLINE',
      modul: 'license',
      entitasId: licenseId,
      metadata: { status, timestamp: new Date().toISOString() },
    });
  }

  // ─── Status ──────────────────────────────────────────────────────────────────

  /**
   * Get current license status without triggering verification.
   * Requirements: 19.7
   */
  async getLicenseStatus(): Promise<LicenseStatusDto> {
    const license = await this.prisma.license.findFirst();
    if (!license) {
      return this.buildStatusDtoFromValues('INACTIVE', null);
    }
    return this.buildStatusDto(license);
  }

  /**
   * Returns true when system should be in read-only mode.
   * Requirements: 19.4
   */
  async isReadOnly(): Promise<boolean> {
    const license = await this.prisma.license.findFirst();
    if (!license) return true;
    return license.status === 'EXPIRED' || license.status === 'REVOKED' || license.status === 'INACTIVE';
  }

  // ─── DTO builders ────────────────────────────────────────────────────────────

  private buildStatusDto(license: any): LicenseStatusDto {
    return this.buildStatusDtoFromValues(license.status as LicenseStatus, license);
  }

  private buildStatusDtoFromValues(status: LicenseStatus, license: any): LicenseStatusDto {
    const fingerprint = this.generateHardwareFingerprint();
    let daysRemaining: number | null = null;

    if (status === 'GRACE_PERIOD' && license?.lastVerifiedAt) {
      const lastVerified = new Date(license.lastVerifiedAt);
      const graceDays = license.gracePeriodDays ?? 30;
      const diffDays = (new Date().getTime() - lastVerified.getTime()) / (1000 * 60 * 60 * 24);
      daysRemaining = Math.max(0, Math.ceil(graceDays - diffDays));
    }

    const isReadOnly = status === 'EXPIRED' || status === 'REVOKED' || status === 'INACTIVE';

    return {
      status,
      licenseKey: license?.licenseKey ?? null,
      activatedAt: license?.activatedAt ?? null,
      lastVerifiedAt: license?.lastVerifiedAt ?? null,
      gracePeriodDays: license?.gracePeriodDays ?? 30,
      daysRemaining,
      isReadOnly,
      hardwareFingerprint: fingerprint,
    };
  }
}
