"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DormitoryService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../common/prisma/prisma.service");
let DormitoryService = class DormitoryService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async createBuilding(tenantId, dto) {
        return this.prisma.building.create({ data: { ...dto, tenantId } });
    }
    async findAllBuildings(tenantId) {
        return this.prisma.building.findMany({
            where: { tenantId },
            include: {
                _count: { select: { rooms: true } },
            },
        });
    }
    async updateBuilding(tenantId, id, dto) {
        const building = await this.prisma.building.findFirst({ where: { id, tenantId } });
        if (!building)
            throw new common_1.NotFoundException('Building not found');
        return this.prisma.building.update({ where: { id }, data: dto });
    }
    async createRoom(tenantId, dto) {
        return this.prisma.room.create({ data: { ...dto, tenantId } });
    }
    async findAllRooms(tenantId, buildingId) {
        const where = { tenantId };
        if (buildingId)
            where.buildingId = buildingId;
        return this.prisma.room.findMany({
            where,
            include: {
                building: { select: { name: true, gender: true } },
                _count: { select: { assignments: { where: { status: 'ACTIVE' } } } },
            },
        });
    }
    async updateRoom(tenantId, id, dto) {
        const room = await this.prisma.room.findFirst({ where: { id, tenantId } });
        if (!room)
            throw new common_1.NotFoundException('Room not found');
        return this.prisma.room.update({ where: { id }, data: dto });
    }
    async assignRoom(tenantId, roomId, dto) {
        await this.prisma.room.findFirstOrThrow({ where: { id: roomId, tenantId } });
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
    async checkoutRoom(tenantId, assignmentId, dto) {
        const assignment = await this.prisma.roomAssignment.findFirst({
            where: { id: assignmentId, tenantId, status: 'ACTIVE' },
        });
        if (!assignment)
            throw new common_1.NotFoundException('Active room assignment not found');
        return this.prisma.roomAssignment.update({
            where: { id: assignmentId },
            data: {
                status: dto.status || 'MOVED',
                endDate: new Date(dto.endDate),
            },
        });
    }
    async createTicket(tenantId, dto, userId) {
        return this.prisma.maintenanceTicket.create({
            data: {
                ...dto,
                tenantId,
                reportedBy: userId,
            },
        });
    }
    async findAllTickets(tenantId, status) {
        const where = { tenantId };
        if (status)
            where.status = status;
        return this.prisma.maintenanceTicket.findMany({
            where,
            include: {
                room: { select: { name: true, building: { select: { name: true } } } },
            },
            orderBy: { createdAt: 'desc' },
        });
    }
    async updateTicket(tenantId, id, dto) {
        const ticket = await this.prisma.maintenanceTicket.findFirst({ where: { id, tenantId } });
        if (!ticket)
            throw new common_1.NotFoundException('Ticket not found');
        return this.prisma.maintenanceTicket.update({
            where: { id },
            data: dto,
        });
    }
};
exports.DormitoryService = DormitoryService;
exports.DormitoryService = DormitoryService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], DormitoryService);
//# sourceMappingURL=dormitory.service.js.map