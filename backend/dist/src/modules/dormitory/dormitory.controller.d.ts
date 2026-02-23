import { DormitoryService } from './dormitory.service';
import { AssignRoomDto, CheckoutRoomDto, CreateBuildingDto, CreateMaintenanceTicketDto, CreateRoomDto, UpdateBuildingDto, UpdateMaintenanceTicketDto, UpdateRoomDto } from './dto/dormitory.dto';
export declare class DormitoryController {
    private readonly dormitoryService;
    constructor(dormitoryService: DormitoryService);
    createBuilding(tenantId: string, dto: CreateBuildingDto): Promise<{
        name: string;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        tenantId: string;
        gender: string;
        description: string | null;
        capacity: number;
    }>;
    findAllBuildings(tenantId: string): Promise<({
        _count: {
            rooms: number;
        };
    } & {
        name: string;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        tenantId: string;
        gender: string;
        description: string | null;
        capacity: number;
    })[]>;
    updateBuilding(tenantId: string, id: string, dto: UpdateBuildingDto): Promise<{
        name: string;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        tenantId: string;
        gender: string;
        description: string | null;
        capacity: number;
    }>;
    createRoom(tenantId: string, dto: CreateRoomDto): Promise<{
        name: string;
        id: string;
        createdAt: Date;
        tenantId: string;
        capacity: number;
        buildingId: string;
        picName: string | null;
    }>;
    findAllRooms(tenantId: string, buildingId?: string): Promise<({
        building: {
            name: string;
            gender: string;
        };
        _count: {
            assignments: number;
        };
    } & {
        name: string;
        id: string;
        createdAt: Date;
        tenantId: string;
        capacity: number;
        buildingId: string;
        picName: string | null;
    })[]>;
    updateRoom(tenantId: string, id: string, dto: UpdateRoomDto): Promise<{
        name: string;
        id: string;
        createdAt: Date;
        tenantId: string;
        capacity: number;
        buildingId: string;
        picName: string | null;
    }>;
    assignRoom(tenantId: string, roomId: string, dto: AssignRoomDto): Promise<{
        id: string;
        status: string;
        tenantId: string;
        santriId: string;
        startDate: Date;
        endDate: Date | null;
        roomId: string;
    }>;
    checkoutRoom(tenantId: string, assignmentId: string, dto: CheckoutRoomDto): Promise<{
        id: string;
        status: string;
        tenantId: string;
        santriId: string;
        startDate: Date;
        endDate: Date | null;
        roomId: string;
    }>;
    createTicket(tenantId: string, dto: CreateMaintenanceTicketDto, user: any): Promise<{
        title: string;
        id: string;
        status: string;
        createdAt: Date;
        updatedAt: Date;
        tenantId: string;
        description: string;
        roomId: string;
        priority: string;
        resolvedAt: Date | null;
        reportedBy: string;
    }>;
    findAllTickets(tenantId: string, status?: string): Promise<({
        room: {
            name: string;
            building: {
                name: string;
            };
        };
    } & {
        title: string;
        id: string;
        status: string;
        createdAt: Date;
        updatedAt: Date;
        tenantId: string;
        description: string;
        roomId: string;
        priority: string;
        resolvedAt: Date | null;
        reportedBy: string;
    })[]>;
    updateTicket(tenantId: string, id: string, dto: UpdateMaintenanceTicketDto): Promise<{
        title: string;
        id: string;
        status: string;
        createdAt: Date;
        updatedAt: Date;
        tenantId: string;
        description: string;
        roomId: string;
        priority: string;
        resolvedAt: Date | null;
        reportedBy: string;
    }>;
}
