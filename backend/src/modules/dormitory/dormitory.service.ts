import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
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

@Injectable()
export class DormitoryService {
  constructor(private readonly prisma: PrismaService) {}

  // --- Buildings ---
  async createBuilding(tenantId: string, dto: CreateBuildingDto) {
    return this.prisma.building.create({ data: { ...dto, tenantId } });
  }

  async findAllBuildings(tenantId: string) {
    return this.prisma.building.findMany({
      where: { tenantId },
      include: {
        _count: { select: { rooms: true } },
      },
    });
  }

  async updateBuilding(tenantId: string, id: string, dto: UpdateBuildingDto) {
    const building = await this.prisma.building.findFirst({ where: { id, tenantId } });
    if (!building) throw new NotFoundException('Building not found');
    return this.prisma.building.update({ where: { id }, data: dto });
  }

  // --- Rooms ---
  async createRoom(tenantId: string, dto: CreateRoomDto) {
    return this.prisma.room.create({ data: { ...dto, tenantId } });
  }

  async findAllRooms(tenantId: string, buildingId?: string) {
    const where: any = { tenantId };
    if (buildingId) where.buildingId = buildingId;

    return this.prisma.room.findMany({
      where,
      include: {
        building: { select: { name: true, gender: true } },
        _count: { select: { assignments: { where: { status: 'ACTIVE' } } } }, // Current occupants
      },
    });
  }

  async updateRoom(tenantId: string, id: string, dto: UpdateRoomDto) {
    const room = await this.prisma.room.findFirst({ where: { id, tenantId } });
    if (!room) throw new NotFoundException('Room not found');
    return this.prisma.room.update({ where: { id }, data: dto });
  }

  // --- Assign Santri to Room ---
  async assignRoom(tenantId: string, roomId: string, dto: AssignRoomDto) {
    await this.prisma.room.findFirstOrThrow({ where: { id: roomId, tenantId } });

    // Cek apakah santri sudah aktif di kamar lain, unassign dulu jika ya
    await this.prisma.roomAssignment.updateMany({
      where: { tenantId, santriId: dto.santriId, status: 'ACTIVE' },
      data: { status: 'MOVED', endDate: new Date() },
    });

    return this.prisma.roomAssignment.create({
      data: {
        tenantId,
        roomId,
        santriId: dto.santriId,
        startDate: dto.startDate ? new Date(dto.startDate) : new Date(),
      },
    });
  }

  async checkoutRoom(tenantId: string, assignmentId: string, dto: CheckoutRoomDto) {
    const assignment = await this.prisma.roomAssignment.findFirst({
      where: { id: assignmentId, tenantId, status: 'ACTIVE' },
    });

    if (!assignment) throw new NotFoundException('Active room assignment not found');

    return this.prisma.roomAssignment.update({
      where: { id: assignmentId },
      data: {
        status: dto.status || 'MOVED',
        endDate: new Date(dto.endDate),
      },
    });
  }

  // --- Maintenance Tickets (Laporan Kerusakan) ---
  async createTicket(tenantId: string, dto: CreateMaintenanceTicketDto, userId: string) {
    return this.prisma.maintenanceTicket.create({
      data: {
        ...dto,
        tenantId,
        reportedBy: userId,
      },
    });
  }

  async findAllTickets(tenantId: string, status?: string) {
    const where: any = { tenantId };
    if (status) where.status = status;

    return this.prisma.maintenanceTicket.findMany({
      where,
      include: {
        room: { select: { name: true, building: { select: { name: true } } } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async updateTicket(tenantId: string, id: string, dto: UpdateMaintenanceTicketDto) {
    const ticket = await this.prisma.maintenanceTicket.findFirst({ where: { id, tenantId } });
    if (!ticket) throw new NotFoundException('Ticket not found');

    return this.prisma.maintenanceTicket.update({
      where: { id },
      data: dto,
    });
  }
}
