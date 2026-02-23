import { PpdbService } from './ppdb.service';
import { AddPpdbDocumentDto, AddPpdbExamDto, CreatePpdbDto, UpdatePpdbDto } from './dto/ppdb.dto';
export declare class PpdbController {
    private readonly ppdbService;
    constructor(ppdbService: PpdbService);
    create(tenantId: string, createPpdbDto: CreatePpdbDto): Promise<{
        id: string;
        registrationNumber: string;
        fullName: string;
        gender: string;
        dob: Date | null;
        previousSchool: string | null;
        pathway: string;
        status: string;
        notes: string | null;
        createdAt: Date;
        updatedAt: Date;
        tenantId: string;
    }>;
    findAll(tenantId: string, status?: string): Promise<({
        _count: {
            documents: number;
            exams: number;
        };
    } & {
        id: string;
        registrationNumber: string;
        fullName: string;
        gender: string;
        dob: Date | null;
        previousSchool: string | null;
        pathway: string;
        status: string;
        notes: string | null;
        createdAt: Date;
        updatedAt: Date;
        tenantId: string;
    })[]>;
    findOne(tenantId: string, id: string): Promise<{
        documents: {
            id: string;
            createdAt: Date;
            tenantId: string;
            registrationId: string;
            documentType: string;
            fileUrl: string;
            isVerified: boolean;
        }[];
        exams: {
            id: string;
            createdAt: Date;
            tenantId: string;
            result: string | null;
            registrationId: string;
            examType: string;
            examDate: Date;
            score: number | null;
            interviewer: string | null;
        }[];
    } & {
        id: string;
        registrationNumber: string;
        fullName: string;
        gender: string;
        dob: Date | null;
        previousSchool: string | null;
        pathway: string;
        status: string;
        notes: string | null;
        createdAt: Date;
        updatedAt: Date;
        tenantId: string;
    }>;
    update(tenantId: string, id: string, updatePpdbDto: UpdatePpdbDto): Promise<{
        id: string;
        registrationNumber: string;
        fullName: string;
        gender: string;
        dob: Date | null;
        previousSchool: string | null;
        pathway: string;
        status: string;
        notes: string | null;
        createdAt: Date;
        updatedAt: Date;
        tenantId: string;
    }>;
    addDocument(tenantId: string, registrationId: string, addDocDto: AddPpdbDocumentDto): Promise<{
        id: string;
        createdAt: Date;
        tenantId: string;
        registrationId: string;
        documentType: string;
        fileUrl: string;
        isVerified: boolean;
    }>;
    addExam(tenantId: string, registrationId: string, addExamDto: AddPpdbExamDto): Promise<{
        id: string;
        createdAt: Date;
        tenantId: string;
        result: string | null;
        registrationId: string;
        examType: string;
        examDate: Date;
        score: number | null;
        interviewer: string | null;
    }>;
}
