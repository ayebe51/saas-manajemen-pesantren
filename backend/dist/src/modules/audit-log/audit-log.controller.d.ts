import { AuditLogService } from './audit-log.service';
export declare class AuditLogController {
    private readonly auditLogService;
    constructor(auditLogService: AuditLogService);
    findAll(tenantId: string, action?: string, entity?: string, userId?: string, limit?: number): Promise<({
        user: {
            name: string;
            role: string;
        } | null;
    } & {
        id: string;
        createdAt: Date;
        tenantId: string | null;
        userId: string | null;
        action: string;
        entity: string;
        entityId: string;
        oldValue: string | null;
        newValue: string | null;
        ip: string | null;
    })[]>;
    findOne(tenantId: string, id: string): Promise<({
        user: {
            name: string;
            email: string;
            role: string;
        } | null;
    } & {
        id: string;
        createdAt: Date;
        tenantId: string | null;
        userId: string | null;
        action: string;
        entity: string;
        entityId: string;
        oldValue: string | null;
        newValue: string | null;
        ip: string | null;
    }) | null>;
}
