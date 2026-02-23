import { PrismaService } from '../../common/prisma/prisma.service';
export declare class AuditLogService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    findAll(tenantId: string, limit?: number, action?: string, entity?: string, userId?: string): Promise<({
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
            role: string;
            email: string;
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
