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
exports.CatatanService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../common/prisma/prisma.service");
let CatatanService = class CatatanService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async createCatatan(tenantId, createCatatanDto, authorId) {
        const santri = await this.prisma.santri.findFirst({
            where: { id: createCatatanDto.santriId, tenantId }
        });
        if (!santri) {
            throw new common_1.NotFoundException('Santri not found');
        }
        return this.prisma.catatanHarian.create({
            data: {
                tenantId,
                authorId,
                ...createCatatanDto,
            }
        });
    }
    async findAllCatatan(tenantId, santriId) {
        const whereClause = { tenantId };
        if (santriId) {
            whereClause.santriId = santriId;
        }
        return this.prisma.catatanHarian.findMany({
            where: whereClause,
            include: {
                santri: { select: { name: true, kelas: true } }
            },
            orderBy: { date: 'desc' }
        });
    }
    async createPengumuman(tenantId, createPengumumanDto) {
        return this.prisma.pengumuman.create({
            data: {
                tenantId,
                ...createPengumumanDto,
            }
        });
    }
    async findAllPengumuman(tenantId, audience) {
        const whereClause = { tenantId };
        if (audience) {
            whereClause.audience = audience;
        }
        return this.prisma.pengumuman.findMany({
            where: whereClause,
            orderBy: { createdAt: 'desc' }
        });
    }
};
exports.CatatanService = CatatanService;
exports.CatatanService = CatatanService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], CatatanService);
//# sourceMappingURL=catatan.service.js.map