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
var KesehatanService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.KesehatanService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../common/prisma/prisma.service");
let KesehatanService = KesehatanService_1 = class KesehatanService {
    constructor(prisma) {
        this.prisma = prisma;
        this.logger = new common_1.Logger(KesehatanService_1.name);
    }
    async createRecord(tenantId, dto, recordedBy) {
        const santri = await this.prisma.santri.findFirst({
            where: { id: dto.santriId, tenantId },
            include: {
                walis: {
                    where: { isPrimary: true },
                    include: { wali: true },
                },
            },
        });
        if (!santri) {
            throw new common_1.NotFoundException('Santri not found');
        }
        const record = await this.prisma.healthRecord.create({
            data: {
                tenantId,
                santriId: dto.santriId,
                recordedBy,
                symptoms: dto.symptoms,
                diagnosis: dto.diagnosis,
                actionTaken: dto.actionTaken,
                referred: dto.referred || false,
            },
        });
        if (dto.referred && santri.walis.length > 0) {
            this.logger.log(`[Job Trigger] Send WA Alert Health Referral to Wali: ${santri.walis[0].wali.phone} for Santri ${santri.name}`);
        }
        return record;
    }
    async findAllRecords(tenantId, santriId) {
        const whereClause = { tenantId };
        if (santriId)
            whereClause.santriId = santriId;
        return this.prisma.healthRecord.findMany({
            where: whereClause,
            include: {
                santri: { select: { name: true, room: true } },
            },
            orderBy: { createdAt: 'desc' },
        });
    }
    async createMedication(tenantId, dto) {
        const santri = await this.prisma.santri.findFirst({
            where: { id: dto.santriId, tenantId },
        });
        if (!santri) {
            throw new common_1.NotFoundException('Santri not found');
        }
        return this.prisma.medication.create({
            data: {
                santriId: dto.santriId,
                medicineName: dto.medicineName,
                dose: dto.dose,
                schedule: dto.schedule,
            },
        });
    }
    async markMedicationGiven(medicationId, tenantId, userId) {
        const med = await this.prisma.medication.findUnique({
            where: { id: medicationId },
            include: { santri: true },
        });
        if (!med || med.santri.tenantId !== tenantId) {
            throw new common_1.NotFoundException('Medication schedule not found');
        }
        return this.prisma.medication.update({
            where: { id: medicationId },
            data: {
                givenBy: userId,
                givenAt: new Date(),
            },
        });
    }
};
exports.KesehatanService = KesehatanService;
exports.KesehatanService = KesehatanService = KesehatanService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], KesehatanService);
//# sourceMappingURL=kesehatan.service.js.map