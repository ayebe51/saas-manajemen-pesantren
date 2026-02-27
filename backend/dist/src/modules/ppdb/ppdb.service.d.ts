import { PrismaService } from '../../common/prisma/prisma.service';
import { AddPpdbDocumentDto, AddPpdbExamDto, CreatePpdbDto, UpdatePpdbDto } from './dto/ppdb.dto';
export declare class PpdbService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    create(tenantId: string, createPpdbDto: CreatePpdbDto): Promise<{
        id: string;
        tenantId: string;
        createdAt: Date;
        updatedAt: Date;
        gender: string;
        dob: Date | null;
        status: string;
        notes: string | null;
        registrationNumber: string;
        fullName: string;
        previousSchool: string | null;
        pathway: string;
    }>;
    findAll(tenantId: string, status?: string): Promise<({
        _count: {
            documents: number;
            exams: number;
        };
    } & {
        id: string;
        tenantId: string;
        createdAt: Date;
        updatedAt: Date;
        gender: string;
        dob: Date | null;
        status: string;
        notes: string | null;
        registrationNumber: string;
        fullName: string;
        previousSchool: string | null;
        pathway: string;
    })[]>;
    findOne(tenantId: string, id: string): Promise<{
        documents: {
            id: string;
            tenantId: string;
            createdAt: Date;
            registrationId: string;
            documentType: string;
            fileUrl: string;
            isVerified: boolean;
        }[];
        exams: {
            id: string;
            tenantId: string;
            createdAt: Date;
            result: string | null;
            registrationId: string;
            examType: string;
            examDate: Date;
            score: number | null;
            interviewer: string | null;
        }[];
    } & {
        id: string;
        tenantId: string;
        createdAt: Date;
        updatedAt: Date;
        gender: string;
        dob: Date | null;
        status: string;
        notes: string | null;
        registrationNumber: string;
        fullName: string;
        previousSchool: string | null;
        pathway: string;
    }>;
    update(tenantId: string, id: string, updatePpdbDto: UpdatePpdbDto): Promise<{
        id: string;
        tenantId: string;
        createdAt: Date;
        updatedAt: Date;
        gender: string;
        dob: Date | null;
        status: string;
        notes: string | null;
        registrationNumber: string;
        fullName: string;
        previousSchool: string | null;
        pathway: string;
    }>;
    addDocument(tenantId: string, registrationId: string, addDocDto: AddPpdbDocumentDto): Promise<{
        id: string;
        tenantId: string;
        createdAt: Date;
        registrationId: string;
        documentType: string;
        fileUrl: string;
        isVerified: boolean;
    }>;
    addExam(tenantId: string, registrationId: string, addExamDto: AddPpdbExamDto): Promise<{
        id: string;
        tenantId: string;
        createdAt: Date;
        result: string | null;
        registrationId: string;
        examType: string;
        examDate: Date;
        score: number | null;
        interviewer: string | null;
    }>;
}
