export declare class CreatePpdbDto {
    fullName: string;
    gender: string;
    dob?: string;
    previousSchool?: string;
    pathway?: string;
}
declare const UpdatePpdbDto_base: import("@nestjs/common").Type<Partial<CreatePpdbDto>>;
export declare class UpdatePpdbDto extends UpdatePpdbDto_base {
    status?: string;
    notes?: string;
}
export declare class AddPpdbDocumentDto {
    documentType: string;
    fileUrl: string;
}
export declare class AddPpdbExamDto {
    examType: string;
    examDate: string;
    score?: number;
    result?: string;
    interviewer?: string;
}
export {};
