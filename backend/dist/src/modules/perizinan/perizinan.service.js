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
var PerizinanService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.PerizinanService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../common/prisma/prisma.service");
const crypto = require("crypto");
let PerizinanService = PerizinanService_1 = class PerizinanService {
    constructor(prisma) {
        this.prisma = prisma;
        this.logger = new common_1.Logger(PerizinanService_1.name);
    }
    async create(tenantId, createIzinDto, requestedBy) {
        const santri = await this.prisma.santri.findFirst({
            where: { id: createIzinDto.santriId, tenantId },
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
        const qrCodeData = `IZIN-${tenantId.substring(0, 8)}-${Date.now()}-${crypto.randomBytes(4).toString('hex')}`;
        const izin = await this.prisma.izin.create({
            data: {
                tenantId,
                santriId: createIzinDto.santriId,
                type: createIzinDto.type,
                reason: createIzinDto.reason,
                startAt: new Date(createIzinDto.startAt),
                endAt: new Date(createIzinDto.endAt),
                status: 'PENDING',
                requestedBy,
                qrCodeData,
            },
        });
        if (santri.walis.length > 0) {
            this.logger.log(`[Job Trigger] Send WA approval link to Wali: ${santri.walis[0].wali.phone} for Izin ${izin.id}`);
        }
        return izin;
    }
    async findAll(tenantId, filters) {
        const whereClause = { tenantId };
        if (filters.status)
            whereClause.status = filters.status;
        if (filters.santriId)
            whereClause.santriId = filters.santriId;
        return this.prisma.izin.findMany({
            where: whereClause,
            include: {
                santri: { select: { name: true, kelas: true, room: true } },
            },
            orderBy: { createdAt: 'desc' },
        });
    }
    async findOne(id, tenantId) {
        const izin = await this.prisma.izin.findFirst({
            where: { id, tenantId },
            include: {
                santri: {
                    include: {
                        walis: { include: { wali: true } },
                    },
                },
            },
        });
        if (!izin) {
            throw new common_1.NotFoundException(`Izin with ID ${id} not found`);
        }
        return izin;
    }
    async approve(id, approveIzinDto) {
        const izin = await this.prisma.izin.findUnique({
            where: { id },
        });
        if (!izin) {
            throw new common_1.NotFoundException('Izin request not found');
        }
        if (izin.status !== 'PENDING') {
            throw new common_1.BadRequestException(`Izin is already ${izin.status}`);
        }
        const waliLink = await this.prisma.santriWali.findUnique({
            where: {
                santriId_waliId: {
                    santriId: izin.santriId,
                    waliId: approveIzinDto.waliId,
                },
            },
        });
        if (!waliLink) {
            throw new common_1.BadRequestException('Wali is not linked to this Santri');
        }
        return this.prisma.izin.update({
            where: { id },
            data: {
                status: approveIzinDto.status,
                approvedBy: approveIzinDto.waliId,
                approvedAt: new Date(),
            },
        });
    }
    async checkout(id, tenantId, operatorId) {
        const izin = await this.findOne(id, tenantId);
        if (izin.status !== 'APPROVED') {
            throw new common_1.BadRequestException(`Cannot check out. Izin status is ${izin.status}`);
        }
        const now = new Date();
        return this.prisma.izin.update({
            where: { id },
            data: {
                status: 'CHECKED_OUT',
                checkoutAt: now,
                checkoutBy: operatorId,
            },
        });
    }
    async checkin(id, tenantId, operatorId) {
        const izin = await this.findOne(id, tenantId);
        if (izin.status !== 'CHECKED_OUT') {
            throw new common_1.BadRequestException(`Cannot check in. Izin status is ${izin.status}`);
        }
        const now = new Date();
        return this.prisma.izin.update({
            where: { id },
            data: {
                status: 'CHECKED_IN',
                checkinAt: now,
                checkinBy: operatorId,
            },
        });
    }
};
exports.PerizinanService = PerizinanService;
exports.PerizinanService = PerizinanService = PerizinanService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], PerizinanService);
//# sourceMappingURL=perizinan.service.js.map