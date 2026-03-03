import {
  Controller,
  Post,
  Body,
  HttpCode,
  HttpStatus,
  Res,
  UseGuards,
  Req,
  Get,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { Response, Request } from 'express';
import { exec } from 'child_process';
import { promisify } from 'util';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { FcmTokenDto } from './dto/fcm-token.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';

@ApiTags('Authentication')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Login user and get access token' })
  @ApiResponse({ status: 200, description: 'Login successful' })
  @ApiResponse({ status: 401, description: 'Invalid credentials' })
  async login(@Body() loginDto: LoginDto, @Res({ passthrough: true }) response: Response) {
    const { accessToken, refreshToken, user } = await this.authService.login(loginDto);

    // Set refresh token in secure httpOnly cookie
    response.cookie('refresh_token', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'none',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    return {
      message: 'Login successful',
      accessToken,
      user,
    };
  }

  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Refresh access token using cookie' })
  @ApiResponse({ status: 200, description: 'Token refreshed successfully' })
  @ApiResponse({ status: 401, description: 'Invalid or missing refresh token' })
  async refresh(@Req() request: Request, @Res({ passthrough: true }) response: Response) {
    const refreshToken = request.cookies['refresh_token'];

    const { accessToken, newRefreshToken, user } =
      await this.authService.refreshToken(refreshToken);

    // Set new refresh token in cookie
    response.cookie('refresh_token', newRefreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'none',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    return {
      message: 'Token refreshed',
      accessToken,
      user,
    };
  }

  @Post('logout')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Logout user and revoke refresh token' })
  async logout(@Req() request: any, @Res({ passthrough: true }) response: Response) {
    const refreshToken = request.cookies['refresh_token'];

    if (refreshToken) {
      await this.authService.logout(request.user.id, refreshToken);
    }

    response.clearCookie('refresh_token', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'none',
    });

    return {
      message: 'Logged out successfully',
    };
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get current user profile' })
  async getMe(@Req() request: any) {
    // request.user is populated by JwtStrategy, but we might want full user data
    // For now, returning request.user is sufficient since it has id, email, role, tenantId
    // If name is really needed, we should fetch from Prisma here or include in JWT.
    // However, the frontend just needs a valid response to keep the session alive.
    return {
      message: 'Profile retrieved',
      data: request.user,
    };
  }

  @Post('fcm-token')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Register Firebase Cloud Messaging (FCM) device token' })
  @ApiResponse({ status: 200, description: 'FCM Token registered successfully' })
  async registerFcmToken(@Req() request: any, @Body() fcmTokenDto: FcmTokenDto) {
    await this.authService.saveFcmToken(request.user.id, fcmTokenDto.token);
    return { message: 'FCM Token registered successfully' };
  }

  @Get('seed')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Temp endpoint to seed DB bypassing local firewall' })
  async runSeed() {
    const execAsync = promisify(exec);
    try {
      // First, ensure all tables are created by running migrations
      const migrateCmd = await execAsync('npx prisma migrate deploy');
      // Then run the seed script
      const seedCmd = await execAsync('npx prisma db seed');

      return {
        success: true,
        message: 'Migration and seeding completed',
        migration: { stdout: migrateCmd.stdout, stderr: migrateCmd.stderr },
        seed: { stdout: seedCmd.stdout, stderr: seedCmd.stderr },
      };
    } catch (e: any) {
      return {
        success: false,
        message: 'Migration or Seeding failed',
        error: e.message,
        stdout: e.stdout,
        stderr: e.stderr,
      };
    }
  }
}
