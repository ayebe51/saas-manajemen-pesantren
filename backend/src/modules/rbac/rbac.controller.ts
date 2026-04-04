import {
  Controller,
  Get,
  Post,
  Put,
  Patch,
  Param,
  Body,
  UseGuards,
  Request,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { RbacService } from './rbac.service';
import { CreateRoleDto } from './dto/create-role.dto';
import { UpdatePermissionsDto } from './dto/update-permissions.dto';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';

@ApiTags('RBAC')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('rbac')
export class RbacController {
  constructor(private readonly rbacService: RbacService) {}

  /** GET /rbac/roles — Super_Admin only */
  @Get('roles')
  @Roles('Super_Admin', 'SUPERADMIN')
  @ApiOperation({ summary: 'Daftar semua role (Super_Admin only)' })
  findAllRoles() {
    return this.rbacService.findAllRoles();
  }

  /** POST /rbac/roles — Super_Admin only */
  @Post('roles')
  @Roles('Super_Admin', 'SUPERADMIN')
  @ApiOperation({ summary: 'Buat role baru (Super_Admin only)' })
  createRole(@Body() dto: CreateRoleDto, @Request() req: any) {
    return this.rbacService.createRole(dto, req.user?.sub);
  }

  /** PUT /rbac/roles/:id/permissions — Super_Admin only */
  @Put('roles/:id/permissions')
  @Roles('Super_Admin', 'SUPERADMIN')
  @ApiOperation({ summary: 'Update permission matrix role (Super_Admin only)' })
  updatePermissions(
    @Param('id') id: string,
    @Body() dto: UpdatePermissionsDto,
    @Request() req: any,
  ) {
    return this.rbacService.updateRolePermissions(id, dto, req.user?.sub);
  }

  /** GET /rbac/users/:id/permissions — Admin+ */
  @Get('users/:id/permissions')
  @Roles('Super_Admin', 'SUPERADMIN', 'Admin_Pesantren', 'TENANT_ADMIN')
  @ApiOperation({ summary: 'Cek permission user (Admin+)' })
  getUserPermissions(@Param('id') id: string) {
    return this.rbacService.getUserPermissions(id);
  }

  /** GET /rbac/roles/:id — Super_Admin only */
  @Get('roles/:id')
  @Roles('Super_Admin', 'SUPERADMIN')
  @ApiOperation({ summary: 'Detail role dengan permissions' })
  findRoleById(@Param('id') id: string) {
    return this.rbacService.findRoleById(id);
  }

  // ─── User Management ────────────────────────────────────────────────────────

  /** GET /rbac/users — Super_Admin, Admin_Pesantren */
  @Get('users')
  @Roles('Super_Admin', 'SUPERADMIN', 'Admin_Pesantren', 'TENANT_ADMIN')
  @ApiOperation({ summary: 'Daftar semua user' })
  findAllUsers() {
    return this.rbacService.findAllUsers();
  }

  /** GET /rbac/users/:id — Super_Admin, Admin_Pesantren */
  @Get('users/:id')
  @Roles('Super_Admin', 'SUPERADMIN', 'Admin_Pesantren', 'TENANT_ADMIN')
  @ApiOperation({ summary: 'Detail user' })
  findUserById(@Param('id') id: string) {
    return this.rbacService.findUserById(id);
  }

  /** POST /rbac/users — Super_Admin only */
  @Post('users')
  @Roles('Super_Admin', 'SUPERADMIN')
  @ApiOperation({ summary: 'Buat user baru (Super_Admin only)' })
  createUser(@Body() dto: CreateUserDto, @Request() req: any) {
    return this.rbacService.createUser(dto, req.user?.sub, req.ip);
  }

  /** PUT /rbac/users/:id — Super_Admin only */
  @Put('users/:id')
  @Roles('Super_Admin', 'SUPERADMIN')
  @ApiOperation({ summary: 'Update data user (Super_Admin only)' })
  updateUser(@Param('id') id: string, @Body() dto: UpdateUserDto, @Request() req: any) {
    return this.rbacService.updateUser(id, dto, req.user?.sub, req.ip);
  }

  /** PATCH /rbac/users/:id/deactivate — Super_Admin only */
  @Patch('users/:id/deactivate')
  @Roles('Super_Admin', 'SUPERADMIN')
  @ApiOperation({ summary: 'Nonaktifkan user dan revoke semua sesi aktif (Super_Admin only)' })
  deactivateUser(@Param('id') id: string, @Request() req: any) {
    return this.rbacService.deactivateUser(id, req.user?.sub, req.ip);
  }
}
