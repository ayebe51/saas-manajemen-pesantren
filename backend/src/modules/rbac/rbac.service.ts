import {
  Injectable,
  NotFoundException,
  ConflictException,
  Logger,
} from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../../common/prisma/prisma.service';
import { AuditLogService } from '../audit-log/audit-log.service';
import { CreateRoleDto } from './dto/create-role.dto';
import { UpdatePermissionsDto } from './dto/update-permissions.dto';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';

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

  // ─── User Management ────────────────────────────────────────────────────────

  /** List all users (excluding password hash) */
  async findAllUsers() {
    return this.prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        roleId: true,
        phone: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
        role_ref: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  /** Get a single user by id */
  async findUserById(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        roleId: true,
        phone: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
        role_ref: { select: { id: true, name: true } },
      },
    });
    if (!user) {
      throw new NotFoundException(`User dengan id '${id}' tidak ditemukan`);
    }
    return user;
  }

  /**
   * Create a new user.
   * Requirements: 2.8
   */
  async createUser(dto: CreateUserDto, actorUserId?: string, ipAddress?: string) {
    const existing = await this.prisma.user.findUnique({ where: { email: dto.email } });
    if (existing) {
      throw new ConflictException(`Email '${dto.email}' sudah terdaftar`);
    }

    const passwordHash = await bcrypt.hash(dto.password, 12);

    const user = await this.prisma.user.create({
      data: {
        email: dto.email,
        name: dto.name,
        passwordHash,
        role: dto.role,
        roleId: dto.roleId ?? null,
        phone: dto.phone ?? null,
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        roleId: true,
        phone: true,
        isActive: true,
        createdAt: true,
      },
    });

    await this.auditLogService.log({
      userId: actorUserId,
      aksi: 'USER_CREATED',
      modul: 'rbac',
      entitasId: user.id,
      entitasTipe: 'User',
      nilaiAfter: { name: user.name, email: user.email, role: user.role },
      ipAddress,
    });

    return user;
  }

  /**
   * Update user data and/or role.
   * Catat perubahan RBAC ke audit log. Requirements: 2.8
   */
  async updateUser(id: string, dto: UpdateUserDto, actorUserId?: string, ipAddress?: string) {
    const existing = await this.findUserById(id);

    const updateData: any = {};
    if (dto.name !== undefined) updateData.name = dto.name;
    if (dto.email !== undefined) updateData.email = dto.email;
    if (dto.role !== undefined) updateData.role = dto.role;
    if (dto.roleId !== undefined) updateData.roleId = dto.roleId;
    if (dto.phone !== undefined) updateData.phone = dto.phone;
    if (dto.isActive !== undefined) updateData.isActive = dto.isActive;
    if (dto.password !== undefined) {
      updateData.passwordHash = await bcrypt.hash(dto.password, 12);
    }

    const updated = await this.prisma.user.update({
      where: { id },
      data: updateData,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        roleId: true,
        phone: true,
        isActive: true,
        updatedAt: true,
      },
    });

    await this.auditLogService.log({
      userId: actorUserId,
      aksi: 'USER_UPDATED',
      modul: 'rbac',
      entitasId: id,
      entitasTipe: 'User',
      nilaiBefore: {
        name: existing.name,
        email: existing.email,
        role: existing.role,
        roleId: existing.roleId,
        isActive: existing.isActive,
      },
      nilaiAfter: {
        name: updated.name,
        email: updated.email,
        role: updated.role,
        roleId: updated.roleId,
        isActive: updated.isActive,
      },
      ipAddress,
    });

    return updated;
  }

  /**
   * Deactivate a user and revoke all their active refresh tokens.
   * Requirements: 2.8, 16.2
   */
  async deactivateUser(id: string, actorUserId?: string, ipAddress?: string) {
    const existing = await this.findUserById(id);

    if (!existing.isActive) {
      return { message: 'User sudah tidak aktif', user: existing };
    }

    // Revoke all active refresh tokens
    const revokedCount = await this.prisma.refreshToken.updateMany({
      where: { userId: id, revoked: false },
      data: { revoked: true, revokedAt: new Date() },
    });

    // Deactivate user
    const updated = await this.prisma.user.update({
      where: { id },
      data: { isActive: false },
      select: { id: true, name: true, email: true, role: true, isActive: true },
    });

    await this.auditLogService.log({
      userId: actorUserId,
      aksi: 'USER_DEACTIVATED',
      modul: 'rbac',
      entitasId: id,
      entitasTipe: 'User',
      nilaiBefore: { isActive: true },
      nilaiAfter: { isActive: false, sessionsRevoked: revokedCount.count },
      ipAddress,
    });

    this.logger.log(`User ${id} deactivated; ${revokedCount.count} session(s) revoked`);

    return { message: 'User berhasil dinonaktifkan', user: updated, sessionsRevoked: revokedCount.count };
  }
}
