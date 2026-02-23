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
var AuthService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthService = void 0;
const common_1 = require("@nestjs/common");
const jwt_1 = require("@nestjs/jwt");
const config_1 = require("@nestjs/config");
const bcrypt = require("bcrypt");
const prisma_service_1 = require("../../common/prisma/prisma.service");
let AuthService = AuthService_1 = class AuthService {
    constructor(prisma, jwtService, configService) {
        this.prisma = prisma;
        this.jwtService = jwtService;
        this.configService = configService;
        this.logger = new common_1.Logger(AuthService_1.name);
    }
    async login(loginDto) {
        const { email, password, tenantId } = loginDto;
        const user = await this.prisma.user.findUnique({
            where: { email },
        });
        if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
            throw new common_1.UnauthorizedException('Invalid email or password');
        }
        if (!user.isActive) {
            throw new common_1.UnauthorizedException('Account is disabled');
        }
        if (user.role !== 'SUPERADMIN' && (!tenantId || user.tenantId !== tenantId)) {
            throw new common_1.UnauthorizedException('Invalid tenant scope for this user');
        }
        const accessToken = this.generateAccessToken(user);
        const refreshToken = this.generateRefreshToken(user);
        await this.saveRefreshToken(user.id, refreshToken);
        await this.prisma.user.update({
            where: { id: user.id },
            data: { lastLogin: new Date() },
        });
        const { passwordHash, ...sanitizedUser } = user;
        return {
            accessToken,
            refreshToken,
            user: sanitizedUser,
        };
    }
    async refreshToken(token) {
        if (!token) {
            throw new common_1.UnauthorizedException('Refresh token is required');
        }
        try {
            const payload = this.jwtService.verify(token, {
                secret: this.configService.get('JWT_REFRESH_SECRET') || 'dev_refresh_secret',
            });
            const savedToken = await this.prisma.refreshToken.findUnique({
                where: { token },
                include: { user: true },
            });
            if (!savedToken || savedToken.revoked) {
                throw new common_1.UnauthorizedException('Refresh token is invalid or has been revoked');
            }
            if (savedToken.user.id !== payload.sub || !savedToken.user.isActive) {
                throw new common_1.UnauthorizedException('User is inactive or token belongs to another user');
            }
            const newAccessToken = this.generateAccessToken(savedToken.user);
            const newRefreshToken = this.generateRefreshToken(savedToken.user);
            await this.prisma.$transaction([
                this.prisma.refreshToken.delete({ where: { id: savedToken.id } }),
                this.prisma.refreshToken.create({
                    data: {
                        userId: savedToken.user.id,
                        token: newRefreshToken,
                        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
                    },
                }),
            ]);
            const { passwordHash, ...sanitizedUser } = savedToken.user;
            return {
                accessToken: newAccessToken,
                newRefreshToken,
                user: sanitizedUser,
            };
        }
        catch (error) {
            this.logger.error(`Refresh token error: ${error.message}`);
            throw new common_1.UnauthorizedException('Invalid refresh token');
        }
    }
    async logout(userId, refreshToken) {
        try {
            await this.prisma.refreshToken.updateMany({
                where: {
                    userId,
                    token: refreshToken,
                },
                data: { revoked: true },
            });
        }
        catch (error) {
            this.logger.error(`Logout error: ${error.message}`);
        }
    }
    async saveFcmToken(userId, token) {
        const user = await this.prisma.user.findUnique({
            where: { id: userId },
        });
        if (!user) {
            throw new common_1.UnauthorizedException('User not found');
        }
        let tokens = [];
        if (user.fcmTokens) {
            try {
                tokens = JSON.parse(user.fcmTokens);
            }
            catch (e) {
                tokens = [];
            }
        }
        if (!tokens.includes(token)) {
            tokens.push(token);
            await this.prisma.user.update({
                where: { id: userId },
                data: { fcmTokens: JSON.stringify(tokens) },
            });
        }
        return { success: true };
    }
    generateAccessToken(user) {
        const payload = {
            sub: user.id,
            email: user.email,
            role: user.role,
            tenantId: user.tenantId,
        };
        return this.jwtService.sign(payload, {
            secret: this.configService.get('JWT_SECRET') || 'dev_secret_key',
            expiresIn: this.configService.get('JWT_EXPIRATION') || '15m',
        });
    }
    generateRefreshToken(user) {
        const payload = {
            sub: user.id,
            email: user.email,
            tokenType: 'refresh',
        };
        return this.jwtService.sign(payload, {
            secret: this.configService.get('JWT_REFRESH_SECRET') || 'dev_refresh_secret',
            expiresIn: this.configService.get('JWT_REFRESH_EXPIRATION') || '7d',
        });
    }
    async saveRefreshToken(userId, token) {
        const expiresInDays = 7;
        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + expiresInDays);
        await this.prisma.refreshToken.create({
            data: {
                userId,
                token,
                expiresAt,
            },
        });
    }
};
exports.AuthService = AuthService;
exports.AuthService = AuthService = AuthService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        jwt_1.JwtService,
        config_1.ConfigService])
], AuthService);
//# sourceMappingURL=auth.service.js.map