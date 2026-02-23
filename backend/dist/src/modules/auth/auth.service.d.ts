import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../common/prisma/prisma.service';
import { LoginDto } from './dto/login.dto';
export declare class AuthService {
    private readonly prisma;
    private readonly jwtService;
    private readonly configService;
    private readonly logger;
    constructor(prisma: PrismaService, jwtService: JwtService, configService: ConfigService);
    login(loginDto: LoginDto): Promise<{
        accessToken: string;
        refreshToken: string;
        user: {
            id: string;
            email: string;
            tenantId: string | null;
            role: string;
            name: string;
            phone: string | null;
            isActive: boolean;
            lastLogin: Date | null;
            fcmTokens: string | null;
            createdAt: Date;
            updatedAt: Date;
        };
    }>;
    refreshToken(token: string): Promise<{
        accessToken: string;
        newRefreshToken: string;
        user: {
            id: string;
            email: string;
            tenantId: string | null;
            role: string;
            name: string;
            phone: string | null;
            isActive: boolean;
            lastLogin: Date | null;
            fcmTokens: string | null;
            createdAt: Date;
            updatedAt: Date;
        };
    }>;
    logout(userId: string, refreshToken: string): Promise<void>;
    saveFcmToken(userId: string, token: string): Promise<{
        success: boolean;
    }>;
    private generateAccessToken;
    private generateRefreshToken;
    private saveRefreshToken;
}
