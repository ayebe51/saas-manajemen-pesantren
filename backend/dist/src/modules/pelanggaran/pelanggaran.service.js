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
exports.PelanggaranService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../common/prisma/prisma.service");
let PelanggaranService = class PelanggaranService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async createPelanggaran(tenantId, dto, recordedBy) {
        const santri = await this.prisma.santri.findFirst({
            where: { id: dto.santriId, tenantId },
        });
        if (!santri) {
            throw new common_1.NotFoundException('Santri not found');
        }
        const pointsMap = { 1: 5, 2: 10, 3: 20, 4: 50, 5: 100 };
        const points = pointsMap[dto.severity] || 0;
        return this.prisma.pelanggaran.create({
            data: {
                tenantId,
                santriId: dto.santriId,
                recordedBy,
                category: dto.category,
                severity: dto.severity,
                points,
                description: dto.description,
            },
        });
    }
    async findAllPelanggaran(tenantId, santriId) {
        const whereClause = { tenantId };
        if (santriId)
            whereClause.santriId = santriId;
        return this.prisma.pelanggaran.findMany({
            where: whereClause,
            include: {
                santri: { select: { name: true, kelas: true } },
            },
            orderBy: { date: 'desc' },
        });
    }
    async createPembinaan(tenantId, dto) {
        const santri = await this.prisma.santri.findFirst({
            where: { id: dto.santriId, tenantId },
        });
        if (!santri) {
            throw new common_1.NotFoundException('Santri not found');
        }
        return this.prisma.pembinaan.create({
            data: {
                tenantId,
                santriId: dto.santriId,
                plan: dto.plan,
                targetDate: new Date(dto.targetDate),
                assignedTo: dto.assignedTo,
                status: 'ONGOING',
            },
        });
    }
    async findAllPembinaan(tenantId, santriId) {
        const whereClause = { tenantId };
        if (santriId)
            whereClause.santriId = santriId;
        return this.prisma.pembinaan.findMany({
            where: whereClause,
            include: {
                santri: { select: { name: true } },
            },
            orderBy: { targetDate: 'asc' },
        });
    }
};
exports.PelanggaranService = PelanggaranService;
exports.PelanggaranService = PelanggaranService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], PelanggaranService);
//# sourceMappingURL=pelanggaran.service.js.map