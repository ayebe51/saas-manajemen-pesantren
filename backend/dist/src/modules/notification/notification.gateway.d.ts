import { OnGatewayConnection, OnGatewayDisconnect } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
export declare class NotificationGateway implements OnGatewayConnection, OnGatewayDisconnect {
    private jwtService;
    private configService;
    server: Server;
    private readonly logger;
    private connectedClients;
    constructor(jwtService: JwtService, configService: ConfigService);
    handleConnection(client: Socket): Promise<void>;
    handleDisconnect(client: Socket): void;
    handlePing(client: Socket, data: any): string;
    sendToUser(userId: string, event: string, payload: any): void;
    sendToTenant(tenantId: string, event: string, payload: any): void;
}
