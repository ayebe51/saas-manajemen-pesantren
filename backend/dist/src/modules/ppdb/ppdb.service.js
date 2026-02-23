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
exports.PpdbService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../common/prisma/prisma.service");
let PpdbService = class PpdbService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async create(tenantId, createPpdbDto) {
        const count = await this.prisma.ppdbRegistration.count({ where: { tenantId } });
        const regNumber = `PPDB-${new Date().getFullYear()}-${(count + 1).toString().padStart(4, '0')}`;
        return this.prisma.ppdbRegistration.create({
            data: {
                ...createPpdbDto,
                tenantId,
                registrationNumber: regNumber,
            },
        });
    }
    async findAll(tenantId, status) {
        const where = { tenantId };
        if (status)
            where.status = status;
        return this.prisma.ppdbRegistration.findMany({
            where,
            orderBy: { createdAt: 'desc' },
            include: {
                _count: { select: { documents: true, exams: true } }
            }
        });
    }
    async findOne(tenantId, id) {
        const registration = await this.prisma.ppdbRegistration.findFirst({
            where: { id, tenantId },
            include: {
                documents: true,
                exams: true,
            },
        });
        if (!registration)
            throw new common_1.NotFoundException('Registration not found');
        return registration;
    }
    async update(tenantId, id, updatePpdbDto) {
        await this.findOne(tenantId, id);
        return this.prisma.ppdbRegistration.update({
            where: { id },
            data: updatePpdbDto,
        });
    }
    async addDocument(tenantId, registrationId, addDocDto) {
        await this.findOne(tenantId, registrationId);
        return this.prisma.ppdbDocument.create({
            data: {
                ...addDocDto,
                tenantId,
                registrationId,
            },
        });
    }
    async addExam(tenantId, registrationId, addExamDto) {
        await this.findOne(tenantId, registrationId);
        return this.prisma.ppdbExam.create({
            data: {
                ...addExamDto,
                tenantId,
                registrationId,
            },
        });
    }
};
exports.PpdbService = PpdbService;
exports.PpdbService = PpdbService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], PpdbService);
//# sourceMappingURL=ppdb.service.js.map