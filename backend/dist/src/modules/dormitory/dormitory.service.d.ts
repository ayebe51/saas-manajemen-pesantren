import { PrismaService } from '../../common/prisma/prisma.service';
import { AssignRoomDto, CheckoutRoomDto, CreateBuildingDto, CreateMaintenanceTicketDto, CreateRoomDto, UpdateBuildingDto, UpdateMaintenanceTicketDto, UpdateRoomDto } from './dto/dormitory.dto';
export declare class DormitoryService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    createBuilding(tenantId: string, dto: CreateBuildingDto): Promise<{
        id: string;
        name: string;
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
        id: string;
        name: string;
        createdAt: Date;
        updatedAt: Date;
        tenantId: string;
        gender: string;
        description: string | null;
        capacity: number;
    })[]>;
    updateBuilding(tenantId: string, id: string, dto: UpdateBuildingDto): Promise<{
        id: string;
        name: string;
        createdAt: Date;
        updatedAt: Date;
        tenantId: string;
        gender: string;
        description: string | null;
        capacity: number;
    }>;
    createRoom(tenantId: string, dto: CreateRoomDto): Promise<{
        id: string;
        name: string;
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
        id: string;
        name: string;
        createdAt: Date;
        tenantId: string;
        capacity: number;
        buildingId: string;
        picName: string | null;
    })[]>;
    updateRoom(tenantId: string, id: string, dto: UpdateRoomDto): Promise<{
        id: string;
        name: string;
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
    createTicket(tenantId: string, dto: CreateMaintenanceTicketDto, userId: string): Promise<{
        id: string;
        status: string;
        createdAt: Date;
        updatedAt: Date;
        tenantId: string;
        description: string;
        title: string;
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
        id: string;
        status: string;
        createdAt: Date;
        updatedAt: Date;
        tenantId: string;
        description: string;
        title: string;
        roomId: string;
        priority: string;
        resolvedAt: Date | null;
        reportedBy: string;
    })[]>;
    updateTicket(tenantId: string, id: string, dto: UpdateMaintenanceTicketDto): Promise<{
        id: string;
        status: string;
        createdAt: Date;
        updatedAt: Date;
        tenantId: string;
        description: string;
        title: string;
        roomId: string;
        priority: string;
        resolvedAt: Date | null;
        reportedBy: string;
    }>;
}
