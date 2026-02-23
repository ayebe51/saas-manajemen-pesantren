import { TenantService } from './tenant.service';
import { CreateTenantDto, UpdateTenantDto } from './dto/tenant.dto';
export declare class TenantController {
    private readonly tenantService;
    constructor(tenantService: TenantService);
    create(createTenantDto: CreateTenantDto, req: any): Promise<{
        id: string;
        name: string;
        phone: string | null;
        createdAt: Date;
        updatedAt: Date;
        address: string | null;
        adminUserId: string | null;
        timezone: string;
        plan: string;
        billingContact: string | null;
        status: string;
        settings: string | null;
    }>;
    findAll(): Promise<({
        _count: {
            users: number;
            santri: number;
        };
    } & {
        id: string;
        name: string;
        phone: string | null;
        createdAt: Date;
        updatedAt: Date;
        address: string | null;
        adminUserId: string | null;
        timezone: string;
        plan: string;
        billingContact: string | null;
        status: string;
        settings: string | null;
    })[]>;
    findOne(id: string, tenantId: string, req: any): Promise<{
        _count: {
            users: number;
            santri: number;
        };
    } & {
        id: string;
        name: string;
        phone: string | null;
        createdAt: Date;
        updatedAt: Date;
        address: string | null;
        adminUserId: string | null;
        timezone: string;
        plan: string;
        billingContact: string | null;
        status: string;
        settings: string | null;
    }>;
    update(id: string, updateTenantDto: UpdateTenantDto, tenantId: string, req: any): Promise<{
        id: string;
        name: string;
        phone: string | null;
        createdAt: Date;
        updatedAt: Date;
        address: string | null;
        adminUserId: string | null;
        timezone: string;
        plan: string;
        billingContact: string | null;
        status: string;
        settings: string | null;
    }>;
}
