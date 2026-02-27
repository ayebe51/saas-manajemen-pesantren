import { AcademicService } from './academic.service';
import { CreateBulkAttendanceDto, CreateGradeDto, CreateScheduleDto } from './dto/academic.dto';
export declare class AcademicController {
    private readonly academicService;
    constructor(academicService: AcademicService);
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
    getSchedule(tenantId: string, kelas: string): Promise<{
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
    getAttendance(tenantId: string, santriId: string): Promise<{
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
    getGrade(tenantId: string, santriId: string, semester?: string, academicYear?: string): Promise<{
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
