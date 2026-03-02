import { PpdbService } from './ppdb.service';
import { AddPpdbDocumentDto, AddPpdbExamDto, CreatePpdbDto, UpdatePpdbDto } from './dto/ppdb.dto';
export declare class PpdbController {
    private readonly ppdbService;
    constructor(ppdbService: PpdbService);
    create(tenantId: string, createPpdbDto: CreatePpdbDto): Promise<{
        id: string;
        status: string;
        createdAt: Date;
        updatedAt: Date;
        tenantId: string;
        gender: string;
        dob: Date | null;
        notes: string | null;
        fullName: string;
        previousSchool: string | null;
        pathway: string;
        registrationNumber: string;
    }>;
    findAll(tenantId: string, status?: string): Promise<({
        _count: {
            documents: number;
            exams: number;
        };
    } & {
        id: string;
        status: string;
        createdAt: Date;
        updatedAt: Date;
        tenantId: string;
        gender: string;
        dob: Date | null;
        notes: string | null;
        fullName: string;
        previousSchool: string | null;
        pathway: string;
        registrationNumber: string;
    })[]>;
    findOne(tenantId: string, id: string): Promise<{
        documents: {
            id: string;
            createdAt: Date;
            tenantId: string;
            documentType: string;
            fileUrl: string;
            isVerified: boolean;
            registrationId: string;
        }[];
        exams: {
            id: string;
            createdAt: Date;
            result: string | null;
            tenantId: string;
            score: number | null;
            examType: string;
            examDate: Date;
            interviewer: string | null;
            registrationId: string;
        }[];
    } & {
        id: string;
        status: string;
        createdAt: Date;
        updatedAt: Date;
        tenantId: string;
        gender: string;
        dob: Date | null;
        notes: string | null;
        fullName: string;
        previousSchool: string | null;
        pathway: string;
        registrationNumber: string;
    }>;
    update(tenantId: string, id: string, updatePpdbDto: UpdatePpdbDto): Promise<{
        id: string;
        status: string;
        createdAt: Date;
        updatedAt: Date;
        tenantId: string;
        gender: string;
        dob: Date | null;
        notes: string | null;
        fullName: string;
        previousSchool: string | null;
        pathway: string;
        registrationNumber: string;
    }>;
    addDocument(tenantId: string, registrationId: string, addDocDto: AddPpdbDocumentDto): Promise<{
        id: string;
        createdAt: Date;
        tenantId: string;
        documentType: string;
        fileUrl: string;
        isVerified: boolean;
        registrationId: string;
    }>;
    addExam(tenantId: string, registrationId: string, addExamDto: AddPpdbExamDto): Promise<{
        id: string;
        createdAt: Date;
        result: string | null;
        tenantId: string;
        score: number | null;
        examType: string;
        examDate: Date;
        interviewer: string | null;
        registrationId: string;
    }>;
}
