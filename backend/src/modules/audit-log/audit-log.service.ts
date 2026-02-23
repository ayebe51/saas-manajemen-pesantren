import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';

@Injectable()
export class AuditLogService {
  constructor(private readonly prisma: PrismaService) {}

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
