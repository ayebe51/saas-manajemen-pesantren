import {
  Injectable,
  NotFoundException,
  ConflictException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { AuditLogService } from '../audit-log/audit-log.service';
import { CreateRoleDto } from './dto/create-role.dto';
import { UpdatePermissionsDto } from './dto/update-permissions.dto';

@Injectable()
export class RbacService {
  private readonly logger = new Logger(RbacService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly auditLogService: AuditLogService,
  ) {}

  /** List all roles with their permissions */
  async findAllRoles() {
    return this.prisma.role.findMany({
      include: { permissions: true },
      orderBy: { name: 'asc' },
    });
  }

  /** Get a single role with permissions */
  async findRoleById(id: string) {
    const role = await this.prisma.role.findUnique({
      where: { id },
      include: { permissions: true },
    });
    if (!role) {
      throw new NotFoundException(`Role dengan id '${id}' tidak ditemukan`);
    }
    return role;
  }

  /** Create a new role */
  async createRole(dto: CreateRoleDto, actorUserId?: string) {
    const existing = await this.prisma.role.findUnique({ where: { name: dto.name } });
    if (existing) {
      throw new ConflictException(`Role '${dto.name}' sudah ada`);
    }

    const role = await this.prisma.role.create({
      data: {
        name: dto.name,
        description: dto.description,
      },
      include: { permissions: true },
    });

    await this.auditLogService.log({
      userId: actorUserId,
      aksi: 'RBAC_ROLE_CREATED',
      modul: 'rbac',
      entitasId: role.id,
      entitasTipe: 'Role',
      nilaiAfter: { name: role.name, description: role.description },
    });

    return role;
  }

  /**
   * Replace the full permission matrix for a role.
   * Uses upsert per module so callers can send the complete desired state.
   * Requirements: 2.5, 2.6
   */
  async updateRolePermissions(
    roleId: string,
    dto: UpdatePermissionsDto,
    actorUserId?: string,
  ) {
    const role = await this.prisma.role.findUnique({
      where: { id: roleId },
      include: { permissions: true },
    });
    if (!role) {
      throw new NotFoundException(`Role dengan id '${roleId}' tidak ditemukan`);
    }

    const oldPermissions = role.permissions;

    // Upsert each permission entry
    await this.prisma.$transaction(
      dto.permissions.map((p) =>
        this.prisma.permission.upsert({
          where: { roleId_module: { roleId, module: p.module } },
          create: { roleId, module: p.module, canRead: p.canRead, canWrite: p.canWrite },
          update: { canRead: p.canRead, canWrite: p.canWrite },
        }),
      ),
    );

    const updated = await this.prisma.role.findUnique({
      where: { id: roleId },
      include: { permissions: true },
    });

    await this.auditLogService.log({
      userId: actorUserId,
      aksi: 'RBAC_PERMISSIONS_UPDATED',
      modul: 'rbac',
      entitasId: roleId,
      entitasTipe: 'Role',
      nilaiBefore: { permissions: oldPermissions },
      nilaiAfter: { permissions: updated?.permissions },
    });

    return updated;
  }

  /** Get all permissions for a user based on their assigned role */
  async getUserPermissions(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        role_ref: {
          include: { permissions: true },
        },
      },
    });

    if (!user) {
      throw new NotFoundException(`User dengan id '${userId}' tidak ditemukan`);
    }

    return {
      userId: user.id,
      role: user.role_ref?.name ?? user.role,
      permissions: user.role_ref?.permissions ?? [],
    };
  }

  /** Get permissions for a role */
  async getRolePermissions(roleId: string) {
    const role = await this.prisma.role.findUnique({
      where: { id: roleId },
      include: { permissions: true },
    });
    if (!role) {
      throw new NotFoundException(`Role dengan id '${roleId}' tidak ditemukan`);
    }
    return role.permissions;
  }
}
