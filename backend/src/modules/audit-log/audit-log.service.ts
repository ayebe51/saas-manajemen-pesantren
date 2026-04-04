import { Injectable, Logger } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../common/prisma/prisma.service';
import { CreateAuditLogDto } from './dto/create-audit-log.dto';

@Injectable()
export class AuditLogService {
  private readonly logger = new Logger(AuditLogService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * INSERT-ONLY audit log entry.
   * Always uses server-side timestamp — never accepts client timestamp.
   * Requirements: 20.1, 20.2, 20.4
   */
  async log(dto: CreateAuditLogDto): Promise<void> {
    try {
      await this.prisma.auditLog.create({
        data: {
          userId: dto.userId ?? null,
          action: dto.aksi,
          entity: dto.modul,
          entityId: dto.entitasId ?? 'N/A',
          modul: dto.modul,
          entitasTipe: dto.entitasTipe ?? null,
          nilaiSebelum: dto.nilaiBefore !== undefined ? (dto.nilaiBefore as Prisma.InputJsonValue) : Prisma.JsonNull,
          nilaiSesudah: dto.nilaiAfter !== undefined ? (dto.nilaiAfter as Prisma.InputJsonValue) : Prisma.JsonNull,
          ip: dto.ipAddress ?? null,
          serverTimestamp: new Date(), // always server-side — Requirement 20.4
          // Store metadata in newValue field as JSON string when no nilaiAfter provided
          newValue: dto.metadata !== undefined && dto.nilaiAfter === undefined
            ? JSON.stringify(dto.metadata)
            : undefined,
        },
      });
    } catch (error) {
      // Audit log failure must never break the main flow
      this.logger.error(`AuditLog insert failed: ${error.message}`, error.stack);
    }
  }

  async findAll(
    tenantId: string,
    limit: number = 50,
    action?: string,
    entity?: string,
    userId?: string,
  ) {
    const where: any = { tenantId };

    if (action) where.action = action;
    if (entity) where.entity = entity;
    if (userId) where.userId = userId;

    return this.prisma.auditLog.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: limit,
      include: {
        user: {
          select: { name: true, role: true },
        },
      },
    });
  }

  async findOne(tenantId: string, id: string) {
    return this.prisma.auditLog.findFirst({
      where: { id, tenantId },
      include: {
        user: { select: { name: true, email: true, role: true } },
      },
    });
  }
}
