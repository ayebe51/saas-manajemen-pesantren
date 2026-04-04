import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from '../decorators/roles.decorator';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly prisma: PrismaService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    // Skip if endpoint is public
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) {
      return true;
    }

    const requiredRoles = this.reflector.getAllAndOverride<string[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    // No @Roles() decorator — JWT alone is sufficient
    if (!requiredRoles || requiredRoles.length === 0) {
      return true;
    }

    const { user } = context.switchToHttp().getRequest();
    if (!user) {
      return false;
    }

    // SCANNER tokens have no role-based access beyond their own endpoints
    if (user.role === 'SCANNER') {
      throw new ForbiddenException('You do not have permission to access this resource');
    }

    // Query the database for the user's current role (Requirement 2.6 — changes take effect immediately)
    const dbUser = await this.prisma.user.findUnique({
      where: { id: user.id },
      select: {
        role: true,
        roleId: true,
        role_ref: {
          select: { name: true },
        },
      },
    });

    if (!dbUser) {
      return false;
    }

    // Resolve the effective role name:
    // Prefer the RBAC role_ref name (new system), fall back to legacy role string
    const effectiveRole = dbUser.role_ref?.name ?? dbUser.role;

    // SUPERADMIN always has full access
    if (effectiveRole === 'SUPERADMIN' || effectiveRole === 'Super_Admin') {
      return true;
    }

    const hasRole = requiredRoles.some(
      (r) => r.toLowerCase() === effectiveRole?.toLowerCase(),
    );

    if (!hasRole) {
      throw new ForbiddenException('You do not have permission to access this resource');
    }

    return true;
  }
}
