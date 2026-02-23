import { PrismaService } from '../../common/prisma/prisma.service';
import { CreateTenantDto, UpdateTenantDto } from './dto/tenant.dto';
export declare class TenantService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    create(createTenantDto: CreateTenantDto, adminUserId: string): Promise<{
        id: string;
        name: string;
        address: string | null;
        phone: string | null;
        adminUserId: string | null;
        timezone: string;
        plan: string;
        billingContact: string | null;
        status: string;
        settings: string | null;
        createdAt: Date;
        updatedAt: Date;
    }>;
    findAll(): Promise<({
        _count: {
            users: number;
            santri: number;
        };
    } & {
        id: string;
        name: string;
        address: string | null;
        phone: string | null;
        adminUserId: string | null;
        timezone: string;
        plan: string;
        billingContact: string | null;
        status: string;
        settings: string | null;
        createdAt: Date;
        updatedAt: Date;
    })[]>;
    findOne(id: string): Promise<{
        _count: {
            users: number;
            santri: number;
        };
    } & {
        id: string;
        name: string;
        address: string | null;
        phone: string | null;
        adminUserId: string | null;
        timezone: string;
        plan: string;
        billingContact: string | null;
        status: string;
        settings: string | null;
        createdAt: Date;
        updatedAt: Date;
    }>;
    update(id: string, updateTenantDto: UpdateTenantDto): Promise<{
        id: string;
        name: string;
        address: string | null;
        phone: string | null;
        adminUserId: string | null;
        timezone: string;
        plan: string;
        billingContact: string | null;
        status: string;
        settings: string | null;
        createdAt: Date;
        updatedAt: Date;
    }>;
    remove(id: string): Promise<{
        id: string;
        name: string;
        address: string | null;
        phone: string | null;
        adminUserId: string | null;
        timezone: string;
        plan: string;
        billingContact: string | null;
        status: string;
        settings: string | null;
        createdAt: Date;
        updatedAt: Date;
    }>;
}
