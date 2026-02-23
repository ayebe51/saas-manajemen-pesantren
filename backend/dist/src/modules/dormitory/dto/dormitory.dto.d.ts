export declare class CreateBuildingDto {
    name: string;
    description?: string;
    gender: string;
    capacity?: number;
}
declare const UpdateBuildingDto_base: import("@nestjs/common").Type<Partial<CreateBuildingDto>>;
export declare class UpdateBuildingDto extends UpdateBuildingDto_base {
}
export declare class CreateRoomDto {
    buildingId: string;
    name: string;
    capacity: number;
    picName?: string;
}
declare const UpdateRoomDto_base: import("@nestjs/common").Type<Partial<CreateRoomDto>>;
export declare class UpdateRoomDto extends UpdateRoomDto_base {
}
export declare class AssignRoomDto {
    santriId: string;
    startDate?: string;
}
export declare class CheckoutRoomDto {
    status?: string;
    endDate: string;
}
export declare class CreateMaintenanceTicketDto {
    roomId: string;
    title: string;
    description: string;
    priority?: string;
}
declare const UpdateMaintenanceTicketDto_base: import("@nestjs/common").Type<Partial<CreateMaintenanceTicketDto>>;
export declare class UpdateMaintenanceTicketDto extends UpdateMaintenanceTicketDto_base {
    status?: string;
    resolvedAt?: string;
}
export {};
