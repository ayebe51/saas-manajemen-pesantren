import { TenantService } from './tenant.service';
import { CreateTenantDto, UpdateTenantDto } from './dto/tenant.dto';
export declare class TenantController {
    private readonly tenantService;
    constructor(tenantService: TenantService);
    create(createTenantDto: CreateTenantDto, req: any): Promise<{
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
    findOne(id: string, tenantId: string, req: any): Promise<{
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
    update(id: string, updateTenantDto: UpdateTenantDto, tenantId: string, req: any): Promise<{
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
