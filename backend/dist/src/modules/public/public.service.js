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
var PublicService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.PublicService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../common/prisma/prisma.service");
let PublicService = PublicService_1 = class PublicService {
    constructor(prisma) {
        this.prisma = prisma;
        this.logger = new common_1.Logger(PublicService_1.name);
    }
    async bulkUpsertSantri(tenantId, dto) {
        const results = {
            inserted: 0,
            updated: 0,
            errors: 0,
        };
        await this.prisma.$transaction(async (prisma) => {
            for (const item of dto.santri) {
                try {
                    const existingSantri = await prisma.santri.findFirst({
                        where: { nisn: item.nisn, tenantId },
                        include: { walis: { include: { wali: true } } },
                    });
                    let targetWaliId = existingSantri?.walis?.find(w => w.isPrimary)?.waliId || existingSantri?.walis?.[0]?.waliId;
                    if (item.waliName) {
                        if (existingSantri && existingSantri.walis?.[0]?.wali) {
                            await prisma.wali.update({
                                where: { id: existingSantri.walis[0].wali.id },
                                data: {
                                    name: item.waliName,
                                    phone: item.waliPhone || existingSantri.walis[0].wali.phone,
                                    email: item.waliEmail || existingSantri.walis[0].wali.email,
                                }
                            });
                        }
                        else {
                            const newWali = await prisma.wali.create({
                                data: {
                                    tenantId: tenantId,
                                    name: item.waliName,
                                    relation: 'Ayah',
                                    phone: item.waliPhone || '0000',
                                    email: item.waliEmail,
                                }
                            });
                            targetWaliId = newWali.id;
                        }
                    }
                    let santriId = existingSantri?.id;
                    if (existingSantri) {
                        await prisma.santri.update({
                            where: { id: existingSantri.id },
                            data: {
                                name: item.name,
                                gender: item.gender,
                                kelas: item.kelas,
                            },
                        });
                        results.updated++;
                    }
                    else {
                        const newSantri = await prisma.santri.create({
                            data: {
                                tenantId,
                                nisn: item.nisn,
                                name: item.name,
                                gender: item.gender,
                                kelas: item.kelas,
                            },
                        });
                        santriId = newSantri.id;
                        results.inserted++;
                    }
                    if (santriId && targetWaliId) {
                        const existingLink = await prisma.santriWali.findUnique({
                            where: {
                                santriId_waliId: {
                                    santriId: santriId,
                                    waliId: targetWaliId
                                }
                            }
                        });
                        if (!existingLink) {
                            await prisma.santriWali.create({
                                data: {
                                    santriId: santriId,
                                    waliId: targetWaliId,
                                    isPrimary: true
                                }
                            });
                        }
                    }
                }
                catch (error) {
                    this.logger.error(`Error syncing santri NISN ${item.nisn}: ${error.message}`);
                    results.errors++;
                }
            }
        });
        return {
            success: true,
            message: 'Bulk Sync completed',
            metadata: results,
        };
    }
};
exports.PublicService = PublicService;
exports.PublicService = PublicService = PublicService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], PublicService);
//# sourceMappingURL=public.service.js.map