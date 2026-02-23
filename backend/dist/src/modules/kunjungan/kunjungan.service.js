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
exports.KunjunganService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../common/prisma/prisma.service");
let KunjunganService = class KunjunganService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async create(tenantId, dto) {
        const santri = await this.prisma.santri.findFirst({
            where: { id: dto.santriId, tenantId }
        });
        if (!santri) {
            throw new common_1.NotFoundException('Santri not found');
        }
        const targetDate = new Date(dto.scheduledAt);
        targetDate.setHours(0, 0, 0, 0);
        const nextDay = new Date(targetDate);
        nextDay.setDate(nextDay.getDate() + 1);
        const existingVisits = await this.prisma.kunjungan.count({
            where: {
                tenantId,
                slot: dto.slot,
                scheduledAt: {
                    gte: targetDate,
                    lt: nextDay
                },
                status: { not: 'CANCELLED' }
            }
        });
        const MAX_VISITS_PER_SLOT = 50;
        if (existingVisits >= MAX_VISITS_PER_SLOT) {
            throw new common_1.BadRequestException('Slot kuota kunjungan sudah penuh untuk hari dan sesi ini.');
        }
        return this.prisma.kunjungan.create({
            data: {
                tenantId,
                santriId: dto.santriId,
                scheduledAt: new Date(dto.scheduledAt),
                slot: dto.slot,
                visitorLimit: dto.visitorLimit || 2,
                status: 'SCHEDULED'
            }
        });
    }
    async findAll(tenantId, filters) {
        const whereClause = { tenantId };
        if (filters.santriId)
            whereClause.santriId = filters.santriId;
        if (filters.date) {
            const targetDate = new Date(filters.date);
            targetDate.setHours(0, 0, 0, 0);
            const nextDay = new Date(targetDate);
            nextDay.setDate(nextDay.getDate() + 1);
            whereClause.scheduledAt = {
                gte: targetDate,
                lt: nextDay
            };
        }
        return this.prisma.kunjungan.findMany({
            where: whereClause,
            include: {
                santri: { select: { name: true, room: true } },
                tamu: true
            },
            orderBy: { scheduledAt: 'asc' }
        });
    }
    async getAvailableSlots(tenantId, dateStr) {
        const targetDate = new Date(dateStr);
        targetDate.setHours(0, 0, 0, 0);
        const nextDay = new Date(targetDate);
        nextDay.setDate(nextDay.getDate() + 1);
        const visits = await this.prisma.kunjungan.groupBy({
            by: ['slot'],
            where: {
                tenantId,
                scheduledAt: {
                    gte: targetDate,
                    lt: nextDay
                },
                status: { not: 'CANCELLED' }
            },
            _count: {
                id: true
            }
        });
        const MAX_VISITS_PER_SLOT = 50;
        const slots = ['MORNING', 'AFTERNOON'];
        return slots.map(slot => {
            const booked = visits.find(v => v.slot === slot)?._count.id || 0;
            return {
                slot,
                booked,
                available: MAX_VISITS_PER_SLOT - booked,
                isFull: booked >= MAX_VISITS_PER_SLOT
            };
        });
    }
    async checkin(id, tenantId, visitorName) {
        const visit = await this.prisma.kunjungan.findFirst({
            where: { id, tenantId },
            include: { tamu: true }
        });
        if (!visit) {
            throw new common_1.NotFoundException('Visit not found');
        }
        if (visit.status === 'CANCELLED' || visit.status === 'COMPLETED') {
            throw new common_1.BadRequestException(`Cannot check in. Status is ${visit.status}`);
        }
        if (visit.tamu.length >= visit.visitorLimit) {
            throw new common_1.BadRequestException('Visitor limit reached for this booking');
        }
        return this.prisma.$transaction(async (prisma) => {
            const guestName = visitorName || 'Wali Santri';
            await prisma.tamu.create({
                data: {
                    kunjunganId: id,
                    name: guestName,
                    checkinAt: new Date()
                }
            });
            return prisma.kunjungan.update({
                where: { id },
                data: { status: 'CHECKED_IN' },
                include: { tamu: true }
            });
        });
    }
};
exports.KunjunganService = KunjunganService;
exports.KunjunganService = KunjunganService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], KunjunganService);
//# sourceMappingURL=kunjungan.service.js.map