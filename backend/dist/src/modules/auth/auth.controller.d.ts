import { Response, Request } from 'express';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
export declare class AuthController {
    private readonly authService;
    constructor(authService: AuthService);
    login(loginDto: LoginDto, response: Response): Promise<{
        message: string;
        accessToken: string;
        user: {
            id: string;
            name: string;
            phone: string | null;
            createdAt: Date;
            updatedAt: Date;
            email: string;
            role: string;
            isActive: boolean;
            lastLogin: Date | null;
            tenantId: string | null;
        };
    }>;
    refresh(request: Request, response: Response): Promise<{
        message: string;
        accessToken: string;
        user: {
            id: string;
            name: string;
            phone: string | null;
            createdAt: Date;
            updatedAt: Date;
            email: string;
            role: string;
            isActive: boolean;
            lastLogin: Date | null;
            tenantId: string | null;
        };
    }>;
    logout(request: any, response: Response): Promise<{
        message: string;
    }>;
}
