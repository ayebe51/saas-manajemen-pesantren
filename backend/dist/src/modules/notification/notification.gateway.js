"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var NotificationGateway_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.NotificationGateway = void 0;
const websockets_1 = require("@nestjs/websockets");
const socket_io_1 = require("socket.io");
const common_1 = require("@nestjs/common");
const jwt_1 = require("@nestjs/jwt");
const config_1 = require("@nestjs/config");
let NotificationGateway = NotificationGateway_1 = class NotificationGateway {
    constructor(jwtService, configService) {
        this.jwtService = jwtService;
        this.configService = configService;
        this.logger = new common_1.Logger(NotificationGateway_1.name);
        this.connectedClients = new Map();
    }
    async handleConnection(client) {
        try {
            const token = client.handshake.auth.token || client.handshake.headers.authorization?.split(' ')[1];
            if (!token) {
                client.disconnect();
                return;
            }
            const payload = this.jwtService.verify(token, {
                secret: this.configService.get('JWT_SECRET') || 'dev_secret_key',
            });
            client.join(`user_${payload.sub}`);
            if (payload.tenantId) {
                client.join(`tenant_${payload.tenantId}`);
            }
            this.connectedClients.set(client.id, payload.sub);
            this.logger.log(`Client connected: ${client.id} (User: ${payload.sub})`);
        }
        catch (err) {
            this.logger.error(`Connection error: ${err.message}`);
            client.disconnect();
        }
    }
    handleDisconnect(client) {
        const userId = this.connectedClients.get(client.id);
        this.connectedClients.delete(client.id);
        this.logger.log(`Client disconnected: ${client.id} (User: ${userId})`);
    }
    handlePing(client, data) {
        return 'pong';
    }
    sendToUser(userId, event, payload) {
        this.server.to(`user_${userId}`).emit(event, payload);
    }
    sendToTenant(tenantId, event, payload) {
        this.server.to(`tenant_${tenantId}`).emit(event, payload);
    }
};
exports.NotificationGateway = NotificationGateway;
__decorate([
    (0, websockets_1.WebSocketServer)(),
    __metadata("design:type", socket_io_1.Server)
], NotificationGateway.prototype, "server", void 0);
__decorate([
    (0, websockets_1.SubscribeMessage)('ping'),
    __param(0, (0, websockets_1.ConnectedSocket)()),
    __param(1, (0, websockets_1.MessageBody)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [socket_io_1.Socket, Object]),
    __metadata("design:returntype", String)
], NotificationGateway.prototype, "handlePing", null);
exports.NotificationGateway = NotificationGateway = NotificationGateway_1 = __decorate([
    (0, websockets_1.WebSocketGateway)({
        cors: {
            origin: '*',
        },
    }),
    __metadata("design:paramtypes", [jwt_1.JwtService,
        config_1.ConfigService])
], NotificationGateway);
//# sourceMappingURL=notification.gateway.js.map