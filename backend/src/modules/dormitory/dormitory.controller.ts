import { Controller, Get, Post, Body, Param, Put, UseGuards, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { DormitoryService } from './dormitory.service';
import {
  AssignRoomDto,
  CheckoutRoomDto,
  CreateBuildingDto,
  CreateMaintenanceTicketDto,
  CreateRoomDto,
  UpdateBuildingDto,
  UpdateMaintenanceTicketDto,
  UpdateRoomDto,
} from './dto/dormitory.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { TenantGuard } from '../../common/guards/tenant.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { TenantId } from '../../common/decorators/tenant-id.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@ApiTags('Manajemen Asrama')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, TenantGuard, RolesGuard)
@Controller('api/v1/dormitory')
export class DormitoryController {
  constructor(private readonly dormitoryService: DormitoryService) {}

  // --- Buildings ---
  @Post('buildings')
  @Roles('SUPERADMIN', 'TENANT_ADMIN', 'PENGURUS')
  @ApiOperation({ summary: 'Mendaftarkan Gedung Asrama Baru' })
  createBuilding(@TenantId() tenantId: string, @Body() dto: CreateBuildingDto) {
    return this.dormitoryService.createBuilding(tenantId, dto);
  }

  @Get('buildings')
  @Roles('SUPERADMIN', 'TENANT_ADMIN', 'PENGURUS', 'MUSYRIF')
  @ApiOperation({ summary: 'List Data Gedung Asrama berserta jumlah kamar' })
  findAllBuildings(@TenantId() tenantId: string) {
    return this.dormitoryService.findAllBuildings(tenantId);
  }

  @Put('buildings/:id')
  @Roles('SUPERADMIN', 'TENANT_ADMIN', 'PENGURUS')
  @ApiOperation({ summary: 'Mengedit data gedung' })
  updateBuilding(
    @TenantId() tenantId: string,
    @Param('id') id: string,
    @Body() dto: UpdateBuildingDto,
  ) {
    return this.dormitoryService.updateBuilding(tenantId, id, dto);
  }

  // --- Rooms ---
  @Post('rooms')
  @Roles('SUPERADMIN', 'TENANT_ADMIN', 'PENGURUS')
  @ApiOperation({ summary: 'Membuat kamar baru di dalam sebuah Gedung' })
  createRoom(@TenantId() tenantId: string, @Body() dto: CreateRoomDto) {
    return this.dormitoryService.createRoom(tenantId, dto);
  }

  @Get('rooms')
  @Roles('SUPERADMIN', 'TENANT_ADMIN', 'PENGURUS', 'MUSYRIF')
  @ApiOperation({ summary: 'List Kamar Asrama (Bisa filter by BuildingId)' })
  @ApiQuery({ name: 'buildingId', required: false })
  findAllRooms(@TenantId() tenantId: string, @Query('buildingId') buildingId?: string) {
    return this.dormitoryService.findAllRooms(tenantId, buildingId);
  }

  @Put('rooms/:id')
  @Roles('SUPERADMIN', 'TENANT_ADMIN', 'PENGURUS')
  @ApiOperation({ summary: 'Mengedit kapasitas atau penanggung jawab Kamar' })
  updateRoom(@TenantId() tenantId: string, @Param('id') id: string, @Body() dto: UpdateRoomDto) {
    return this.dormitoryService.updateRoom(tenantId, id, dto);
  }

  // --- Room Assignments ---
  @Post('rooms/:roomId/assign')
  @Roles('SUPERADMIN', 'TENANT_ADMIN', 'PENGURUS', 'MUSYRIF')
  @ApiOperation({ summary: 'Menautkan (Assign) Santri ke Kamar tertentu' })
  assignRoom(
    @TenantId() tenantId: string,
    @Param('roomId') roomId: string,
    @Body() dto: AssignRoomDto,
  ) {
    return this.dormitoryService.assignRoom(tenantId, roomId, dto);
  }

  @Put('assignments/:assignmentId/checkout')
  @Roles('SUPERADMIN', 'TENANT_ADMIN', 'PENGURUS', 'MUSYRIF')
  @ApiOperation({ summary: 'Mencabut (Checkout) status Santri dari Kamar (Mutasi/Lulus)' })
  checkoutRoom(
    @TenantId() tenantId: string,
    @Param('assignmentId') assignmentId: string,
    @Body() dto: CheckoutRoomDto,
  ) {
    return this.dormitoryService.checkoutRoom(tenantId, assignmentId, dto);
  }

  // --- Maintenance Tickets ---
  @Post('tickets')
  @Roles('SUPERADMIN', 'TENANT_ADMIN', 'PENGURUS', 'MUSYRIF', 'SANTRI')
  @ApiOperation({ summary: 'Membuat Laporan Kerusakan fasilitas (Kran Patah, etc)' })
  createTicket(
    @TenantId() tenantId: string,
    @Body() dto: CreateMaintenanceTicketDto,
    @CurrentUser() user: any,
  ) {
    return this.dormitoryService.createTicket(tenantId, dto, user.userId);
  }

  @Get('tickets')
  @Roles('SUPERADMIN', 'TENANT_ADMIN', 'PENGURUS', 'MUSYRIF')
  @ApiOperation({ summary: 'Melihat list laporan kerusakan asrama' })
  @ApiQuery({ name: 'status', required: false, description: 'OPEN, IN_PROGRESS, RESOLVED' })
  findAllTickets(@TenantId() tenantId: string, @Query('status') status?: string) {
    return this.dormitoryService.findAllTickets(tenantId, status);
  }

  @Put('tickets/:id')
  @Roles('SUPERADMIN', 'TENANT_ADMIN', 'PENGURUS')
  @ApiOperation({ summary: 'Update status pengerjaan Maintenance' })
  updateTicket(
    @TenantId() tenantId: string,
    @Param('id') id: string,
    @Body() dto: UpdateMaintenanceTicketDto,
  ) {
    return this.dormitoryService.updateTicket(tenantId, id, dto);
  }
}
