import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { CreateBulkAttendanceDto, CreateGradeDto, CreateScheduleDto } from './dto/academic.dto';

@Injectable()
export class AcademicService {
  private readonly logger = new Logger(AcademicService.name);

  constructor(private readonly prisma: PrismaService) {}

  async createSchedule(tenantId: string, dto: CreateScheduleDto) {
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

  async getScheduleByKelas(tenantId: string, kelas: string) {
    return this.prisma.academicSchedule.findMany({
      where: { tenantId, kelas },
      orderBy: [{ dayOfWeek: 'asc' }, { startTime: 'asc' }],
    });
  }

  async recordAttendance(tenantId: string, userId: string, dto: CreateBulkAttendanceDto) {
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

  async getAttendanceReport(tenantId: string, santriId: string) {
    return this.prisma.attendance.findMany({
      where: { tenantId, santriId },
      orderBy: { date: 'desc' },
      take: 30,
    });
  }

  async createGrade(tenantId: string, dto: CreateGradeDto) {
    const santri = await this.prisma.santri.findFirst({
      where: { id: dto.santriId, tenantId },
    });
    if (!santri) throw new NotFoundException('Santri not found');

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

  async getGradeReport(
    tenantId: string,
    santriId: string,
    semester?: string,
    academicYear?: string,
  ) {
    const where: any = { tenantId, santriId };
    if (semester) where.semester = semester;
    if (academicYear) where.academicYear = academicYear;

    return this.prisma.grade.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });
  }
}
