import { PpdbService } from './ppdb.service';
import { AddPpdbDocumentDto, AddPpdbExamDto, CreatePpdbDto, UpdatePpdbDto } from './dto/ppdb.dto';
export declare class PpdbController {
    private readonly ppdbService;
    constructor(ppdbService: PpdbService);
    create(tenantId: string, createPpdbDto: CreatePpdbDto): Promise<void>;
    findAll(tenantId: string, status?: string): any;
    findOne(tenantId: string, id: string): any;
    update(tenantId: string, id: string, updatePpdbDto: UpdatePpdbDto): any;
    addDocument(tenantId: string, registrationId: string, addDocDto: AddPpdbDocumentDto): any;
    addExam(tenantId: string, registrationId: string, addExamDto: AddPpdbExamDto): any;
}
