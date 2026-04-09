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

  // --- Buildings (Asrama) ---
  async createBuilding(tenantId: string, dto: CreateBuildingDto) {
    // Map English DTO to Indonesian model
    return this.prisma.asrama.create({
      data: {
        tenantId,
        nama: dto.name,
        deskripsi: dto.description,
      },
    });
  }

  async findAllBuildings(tenantId: string) {
    const buildings = await this.prisma.asrama.findMany({
      where: { tenantId },
      include: {
        _count: { select: { kamar: true } },
      },
    });
    
    // Map Indonesian field names to English for frontend compatibility
    return buildings.map(b => ({
      id: b.id,
      name: b.nama,
      type: 'Asrama', // Default type since model doesn't have type field
      _count: { rooms: b._count.kamar },
    }));
  }

  async updateBuilding(tenantId: string, id: string, dto: UpdateBuildingDto) {
    const building = await this.prisma.asrama.findFirst({ where: { id, tenantId } });
    if (!building) throw new NotFoundException('Asrama tidak ditemukan');
    return this.prisma.asrama.update({
      where: { id },
      data: {
        ...(dto.name && { nama: dto.name }),
        ...(dto.description && { deskripsi: dto.description }),
      },
    });
  }

  // --- Rooms (Kamar) ---
  async createRoom(tenantId: string, dto: CreateRoomDto) {
    // Map buildingId to asramaId
    return this.prisma.kamar.create({
      data: {
        asramaId: dto.buildingId, // buildingId is actually asramaId
        nama: dto.name,
        kapasitas: dto.capacity,
        ...(dto.floor && { lantai: parseInt(dto.floor) }),
      },
    });
  }

  async findAllRooms(tenantId: string, buildingId?: string) {
    const where: any = {};
    if (buildingId) where.asramaId = buildingId;

    const rooms = await this.prisma.kamar.findMany({
      where,
      include: {
        asrama: { select: { nama: true } },
        _count: { select: { penempatan: { where: { isAktif: true } } } },
      },
    });

    // Map Indonesian field names to English for frontend compatibility
    return rooms.map(r => ({
      id: r.id,
      name: r.nama,
      capacity: r.kapasitas,
      floor: r.lantai?.toString() || '1',
      building: { name: r.asrama.nama },
      currentOccupancy: r._count.penempatan,
    }));
  }

  async getSantriByKamar(tenantId: string, kamarId: string) {
    const kamar = await this.prisma.kamar.findFirst({ where: { id: kamarId } });
    if (!kamar) throw new NotFoundException('Kamar tidak ditemukan');

    const penempatan = await this.prisma.penempatanSantri.findMany({
      where: { kamarId, isAktif: true },
      include: {
        santri: {
          select: {
            id: true,
            name: true,
            nis: true,
            nisn: true,
            jenisKelamin: true,
            photo: true,
            status: true,
          },
        },
      },
    });

    return penempatan.map(p => ({
      id: p.id,
      santri: {
        id: p.santri.id,
        name: p.santri.name,
        nis: p.santri.nis,
        nisn: p.santri.nisn,
        gender: p.santri.jenisKelamin,
        photo: p.santri.photo,
        status: p.santri.status,
      },
      tanggalMasuk: p.tanggalMasuk,
    }));
  }

  async updateRoom(tenantId: string, id: string, dto: UpdateRoomDto) {
    const room = await this.prisma.kamar.findFirst({ where: { id } });
    if (!room) throw new NotFoundException('Kamar tidak ditemukan');
    return this.prisma.kamar.update({
      where: { id },
      data: {
        ...(dto.name && { nama: dto.name }),
        ...(dto.capacity && { kapasitas: dto.capacity }),
      },
    });
  }

  // --- Assign Santri to Room (Penempatan Santri) ---
  async assignRoom(tenantId: string, roomId: string, dto: AssignRoomDto) {
    await this.prisma.kamar.findFirstOrThrow({ where: { id: roomId } });

    // Cek apakah santri sudah aktif di kamar lain, ubah status dulu jika ya
    await this.prisma.penempatanSantri.updateMany({
      where: { santriId: dto.santriId, isAktif: true },
      data: { isAktif: false, tanggalKeluar: new Date() },
    });

    return this.prisma.penempatanSantri.create({
      data: {
        kamarId: roomId,
        santriId: dto.santriId,
        tanggalMasuk: dto.startDate ? new Date(dto.startDate) : new Date(),
        isAktif: true,
      },
    });
  }

  async checkoutRoom(tenantId: string, assignmentId: string, dto: CheckoutRoomDto) {
    const assignment = await this.prisma.penempatanSantri.findFirst({
      where: { id: assignmentId, isAktif: true },
    });

    if (!assignment) throw new NotFoundException('Penempatan santri aktif tidak ditemukan');

    return this.prisma.penempatanSantri.update({
      where: { id: assignmentId },
      data: {
        isAktif: false,
        tanggalKeluar: new Date(dto.endDate),
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
    if (!ticket) throw new NotFoundException('Tiket tidak ditemukan');

    return this.prisma.maintenanceTicket.update({
      where: { id },
      data: dto,
    });
  }
}
