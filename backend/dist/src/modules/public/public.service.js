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
                    const existing = await prisma.santri.findFirst({
                        where: { nisn: item.nisn, tenantId },
                    });
                    if (existing) {
                        await prisma.santri.update({
                            where: { id: existing.id },
                            data: {
                                name: item.name,
                                gender: item.gender,
                                kelas: item.kelas,
                            },
                        });
                        results.updated++;
                    }
                    else {
                        await prisma.santri.create({
                            data: {
                                tenantId,
                                nisn: item.nisn,
                                name: item.name,
                                gender: item.gender,
                                kelas: item.kelas,
                            },
                        });
                        results.inserted++;
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
            message: 'Sync completed',
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