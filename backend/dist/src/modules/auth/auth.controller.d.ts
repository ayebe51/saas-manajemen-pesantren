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
            email: string;
            tenantId: string | null;
            role: string;
            name: string;
            phone: string | null;
            isActive: boolean;
            lastLogin: Date | null;
            createdAt: Date;
            updatedAt: Date;
        };
    }>;
    refresh(request: Request, response: Response): Promise<{
        message: string;
        accessToken: string;
        user: {
            id: string;
            email: string;
            tenantId: string | null;
            role: string;
            name: string;
            phone: string | null;
            isActive: boolean;
            lastLogin: Date | null;
            createdAt: Date;
            updatedAt: Date;
        };
    }>;
    logout(request: any, response: Response): Promise<{
        message: string;
    }>;
}
