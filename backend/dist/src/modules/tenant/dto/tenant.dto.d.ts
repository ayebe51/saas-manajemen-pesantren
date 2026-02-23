export declare class CreateTenantDto {
    name: string;
    address?: string;
    phone?: string;
    timezone?: string;
    plan?: string;
}
export declare class UpdateTenantDto {
    name?: string;
    address?: string;
    phone?: string;
    billingContact?: string;
    status?: string;
    plan?: string;
    settings?: any;
}
