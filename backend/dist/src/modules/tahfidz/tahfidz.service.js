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
var TahfidzService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.TahfidzService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../common/prisma/prisma.service");
let TahfidzService = TahfidzService_1 = class TahfidzService {
    constructor(prisma) {
        this.prisma = prisma;
        this.logger = new common_1.Logger(TahfidzService_1.name);
    }
    async createTahfidz(tenantId, userId, dto) {
        const santri = await this.prisma.santri.findFirst({
            where: { id: dto.santriId, tenantId },
        });
        if (!santri) {
            throw new common_1.NotFoundException('Santri not found in this tenant');
        }
        const tahfidz = await this.prisma.tahfidz.create({
            data: {
                tenantId,
                santriId: dto.santriId,
                surah: dto.surah,
                ayat: dto.ayat,
                type: dto.type,
                grade: dto.grade,
                notes: dto.notes,
                date: dto.date ? new Date(dto.date) : new Date(),
                recordedBy: userId,
            },
        });
        return tahfidz;
    }
    async getTahfidzBySantri(tenantId, santriId) {
        return this.prisma.tahfidz.findMany({
            where: { tenantId, santriId },
            orderBy: { date: 'desc' },
        });
    }
    async getTahfidzAllSantri(tenantId) {
        return this.prisma.tahfidz.findMany({
            where: { tenantId },
            orderBy: { date: 'desc' },
            include: {
                santri: { select: { name: true, kelas: true } },
            },
        });
    }
    async createOrUpdateMutabaah(tenantId, userId, dto) {
        const santri = await this.prisma.santri.findFirst({
            where: { id: dto.santriId, tenantId },
        });
        if (!santri) {
            throw new common_1.NotFoundException('Santri not found in this tenant');
        }
        const targetDate = dto.date ? new Date(dto.date) : new Date();
        targetDate.setHours(0, 0, 0, 0);
        const nextDay = new Date(targetDate);
        nextDay.setDate(targetDate.getDate() + 1);
        const existing = await this.prisma.mutabaah.findFirst({
            where: {
                tenantId,
                santriId: dto.santriId,
                date: {
                    gte: targetDate,
                    lt: nextDay,
                },
            },
        });
        if (existing) {
            return this.prisma.mutabaah.update({
                where: { id: existing.id },
                data: {
                    sholatWajib: dto.sholatWajib ?? existing.sholatWajib,
                    tahajud: dto.tahajud ?? existing.tahajud,
                    dhuha: dto.dhuha ?? existing.dhuha,
                    puasaSunnah: dto.puasaSunnah ?? existing.puasaSunnah,
                    bacaQuran: dto.bacaQuran ?? existing.bacaQuran,
                    notes: dto.notes ?? existing.notes,
                    recordedBy: userId,
                },
            });
        }
        return this.prisma.mutabaah.create({
            data: {
                tenantId,
                santriId: dto.santriId,
                date: targetDate,
                sholatWajib: dto.sholatWajib ?? true,
                tahajud: dto.tahajud ?? false,
                dhuha: dto.dhuha ?? false,
                puasaSunnah: dto.puasaSunnah ?? false,
                bacaQuran: dto.bacaQuran ?? true,
                notes: dto.notes,
                recordedBy: userId,
            },
        });
    }
    async getMutabaahBySantri(tenantId, santriId) {
        return this.prisma.mutabaah.findMany({
            where: { tenantId, santriId },
            orderBy: { date: 'desc' },
            take: 30,
        });
    }
};
exports.TahfidzService = TahfidzService;
exports.TahfidzService = TahfidzService = TahfidzService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], TahfidzService);
//# sourceMappingURL=tahfidz.service.js.map