import { PrismaService } from '../../common/prisma/prisma.service';
import { CreateBulkAttendanceDto, CreateGradeDto, CreateScheduleDto } from './dto/academic.dto';
export declare class AcademicService {
    private readonly prisma;
    private readonly logger;
    constructor(prisma: PrismaService);
    createSchedule(tenantId: string, dto: CreateScheduleDto): Promise<{
        id: string;
        createdAt: Date;
        tenantId: string;
        kelas: string;
        room: string | null;
        subject: string;
        teacherId: string;
        dayOfWeek: number;
        startTime: string;
        endTime: string;
    }>;
    getScheduleByKelas(tenantId: string, kelas: string): Promise<{
        id: string;
        createdAt: Date;
        tenantId: string;
        kelas: string;
        room: string | null;
        subject: string;
        teacherId: string;
        dayOfWeek: number;
        startTime: string;
        endTime: string;
    }[]>;
    recordAttendance(tenantId: string, userId: string, dto: CreateBulkAttendanceDto): Promise<import(".prisma/client").Prisma.BatchPayload>;
    getAttendanceReport(tenantId: string, santriId: string): Promise<{
        id: string;
        status: string;
        createdAt: Date;
        tenantId: string;
        santriId: string;
        date: Date;
        notes: string | null;
        recordedBy: string | null;
        scheduleId: string | null;
    }[]>;
    createGrade(tenantId: string, dto: CreateGradeDto): Promise<{
        id: string;
        createdAt: Date;
        tenantId: string;
        type: string;
        santriId: string;
        notes: string | null;
        subject: string;
        semester: string;
        academicYear: string;
        score: number;
    }>;
    getGradeReport(tenantId: string, santriId: string, semester?: string, academicYear?: string): Promise<{
        id: string;
        createdAt: Date;
        tenantId: string;
        type: string;
        santriId: string;
        notes: string | null;
        subject: string;
        semester: string;
        academicYear: string;
        score: number;
    }[]>;
}
