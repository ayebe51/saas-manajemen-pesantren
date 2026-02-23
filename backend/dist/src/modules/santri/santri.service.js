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
exports.SantriService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../common/prisma/prisma.service");
let SantriService = class SantriService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async create(tenantId, createSantriDto) {
        return this.prisma.santri.create({
            data: {
                ...createSantriDto,
                tenantId,
            },
        });
    }
    async findAll(tenantId, filters) {
        const whereClause = { tenantId };
        if (filters.kelas)
            whereClause.kelas = filters.kelas;
        if (filters.room)
            whereClause.room = filters.room;
        return this.prisma.santri.findMany({
            where: whereClause,
            include: {
                walis: {
                    include: { wali: true }
                }
            },
            orderBy: { name: 'asc' }
        });
    }
    async findOne(id, tenantId) {
        const santri = await this.prisma.santri.findFirst({
            where: { id, tenantId },
            include: {
                walis: {
                    include: { wali: true }
                },
                _count: {
                    select: { izin: true, pelanggaran: true, invoices: true }
                }
            }
        });
        if (!santri) {
            throw new common_1.NotFoundException(`Santri with ID ${id} not found`);
        }
        return santri;
    }
    async update(id, tenantId, updateSantriDto) {
        await this.findOne(id, tenantId);
        return this.prisma.santri.update({
            where: { id },
            data: updateSantriDto,
        });
    }
    async addWali(santriId, tenantId, createWaliDto) {
        await this.findOne(santriId, tenantId);
        const existingLinks = await this.prisma.santriWali.count({
            where: { santriId }
        });
        const isPrimary = existingLinks === 0;
        return this.prisma.$transaction(async (prisma) => {
            const wali = await prisma.wali.create({
                data: {
                    ...createWaliDto,
                    tenantId,
                }
            });
            await prisma.santriWali.create({
                data: {
                    santriId,
                    waliId: wali.id,
                    isPrimary
                }
            });
            return wali;
        });
    }
    async linkWali(santriId, waliId, tenantId) {
        await this.findOne(santriId, tenantId);
        const wali = await this.prisma.wali.findFirst({
            where: { id: waliId, tenantId }
        });
        if (!wali) {
            throw new common_1.NotFoundException(`Wali with ID ${waliId} not found`);
        }
        const existingLink = await this.prisma.santriWali.findUnique({
            where: { santriId_waliId: { santriId, waliId } }
        });
        if (existingLink) {
            return existingLink;
        }
        const existingLinksCount = await this.prisma.santriWali.count({
            where: { santriId }
        });
        return this.prisma.santriWali.create({
            data: {
                santriId,
                waliId,
                isPrimary: existingLinksCount === 0
            }
        });
    }
};
exports.SantriService = SantriService;
exports.SantriService = SantriService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], SantriService);
//# sourceMappingURL=santri.service.js.map