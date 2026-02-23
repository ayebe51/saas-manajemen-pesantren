export declare class CreateScheduleDto {
    subject: string;
    teacherId: string;
    kelas: string;
    dayOfWeek: number;
    startTime: string;
    endTime: string;
    room?: string;
}
export declare enum AttendanceStatus {
    HADIR = "HADIR",
    SAKIT = "SAKIT",
    IZIN = "IZIN",
    ALPA = "ALPA"
}
export declare class StudentAttendanceDto {
    santriId: string;
    status: AttendanceStatus;
    notes?: string;
}
export declare class CreateBulkAttendanceDto {
    scheduleId?: string;
    date?: string;
    attendances: StudentAttendanceDto[];
}
export declare class CreateGradeDto {
    santriId: string;
    subject: string;
    semester: string;
    academicYear: string;
    type: string;
    score: number;
    notes?: string;
}
