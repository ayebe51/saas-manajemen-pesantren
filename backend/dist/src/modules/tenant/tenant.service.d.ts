import { PrismaService } from '../../common/prisma/prisma.service';
import { CreateTenantDto, UpdateTenantDto } from './dto/tenant.dto';
export declare class TenantService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    create(createTenantDto: CreateTenantDto, adminUserId: string): Promise<{
        phone: string | null;
        settings: string | null;
        name: string;
        id: string;
        address: string | null;
        adminUserId: string | null;
        timezone: string;
        plan: string;
        billingContact: string | null;
        status: string;
        createdAt: Date;
        updatedAt: Date;
    }>;
    findAll(): Promise<({
        _count: {
            users: number;
            santri: number;
        };
    } & {
        phone: string | null;
        settings: string | null;
        name: string;
        id: string;
        address: string | null;
        adminUserId: string | null;
        timezone: string;
        plan: string;
        billingContact: string | null;
        status: string;
        createdAt: Date;
        updatedAt: Date;
    })[]>;
    findOne(id: string): Promise<{
        _count: {
            users: number;
            santri: number;
        };
    } & {
        phone: string | null;
        settings: string | null;
        name: string;
        id: string;
        address: string | null;
        adminUserId: string | null;
        timezone: string;
        plan: string;
        billingContact: string | null;
        status: string;
        createdAt: Date;
        updatedAt: Date;
    }>;
    update(id: string, updateTenantDto: UpdateTenantDto): Promise<{
        phone: string | null;
        settings: string | null;
        name: string;
        id: string;
        address: string | null;
        adminUserId: string | null;
        timezone: string;
        plan: string;
        billingContact: string | null;
        status: string;
        createdAt: Date;
        updatedAt: Date;
    }>;
    remove(id: string): Promise<{
        phone: string | null;
        settings: string | null;
        name: string;
        id: string;
        address: string | null;
        adminUserId: string | null;
        timezone: string;
        plan: string;
        billingContact: string | null;
        status: string;
        createdAt: Date;
        updatedAt: Date;
    }>;
}
