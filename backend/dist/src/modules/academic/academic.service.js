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
var AcademicService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.AcademicService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../common/prisma/prisma.service");
let AcademicService = AcademicService_1 = class AcademicService {
    constructor(prisma) {
        this.prisma = prisma;
        this.logger = new common_1.Logger(AcademicService_1.name);
    }
    async createSchedule(tenantId, dto) {
        return this.prisma.academicSchedule.create({
            data: {
                tenantId,
                subject: dto.subject,
                teacherId: dto.teacherId,
                kelas: dto.kelas,
                dayOfWeek: dto.dayOfWeek,
                startTime: dto.startTime,
                endTime: dto.endTime,
                room: dto.room,
            },
        });
    }
    async getScheduleByKelas(tenantId, kelas) {
        return this.prisma.academicSchedule.findMany({
            where: { tenantId, kelas },
            orderBy: [{ dayOfWeek: 'asc' }, { startTime: 'asc' }],
        });
    }
    async recordAttendance(tenantId, userId, dto) {
        const targetDate = dto.date ? new Date(dto.date) : new Date();
        targetDate.setHours(0, 0, 0, 0);
        const attendances = dto.attendances.map((a) => ({
            tenantId,
            santriId: a.santriId,
            scheduleId: dto.scheduleId,
            date: targetDate,
            status: a.status,
            notes: a.notes,
            recordedBy: userId,
        }));
        return this.prisma.attendance.createMany({
            data: attendances,
        });
    }
    async getAttendanceReport(tenantId, santriId) {
        return this.prisma.attendance.findMany({
            where: { tenantId, santriId },
            orderBy: { date: 'desc' },
            take: 30,
        });
    }
    async createGrade(tenantId, dto) {
        const santri = await this.prisma.santri.findFirst({
            where: { id: dto.santriId, tenantId },
        });
        if (!santri)
            throw new common_1.NotFoundException('Santri not found');
        return this.prisma.grade.create({
            data: {
                tenantId,
                santriId: dto.santriId,
                subject: dto.subject,
                semester: dto.semester,
                academicYear: dto.academicYear,
                type: dto.type,
                score: dto.score,
                notes: dto.notes,
            },
        });
    }
    async getGradeReport(tenantId, santriId, semester, academicYear) {
        const where = { tenantId, santriId };
        if (semester)
            where.semester = semester;
        if (academicYear)
            where.academicYear = academicYear;
        return this.prisma.grade.findMany({
            where,
            orderBy: { createdAt: 'desc' },
        });
    }
};
exports.AcademicService = AcademicService;
exports.AcademicService = AcademicService = AcademicService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], AcademicService);
//# sourceMappingURL=academic.service.js.map