import { Controller, Post, Body, HttpCode, HttpStatus, Res, UseGuards, Req } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { Response, Request } from 'express';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
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
  async login(
    @Body() loginDto: LoginDto,
    @Res({ passthrough: true }) response: Response,
  ) {
    const { accessToken, refreshToken, user } = await this.authService.login(loginDto);
    
    // Set refresh token in secure httpOnly cookie
    response.cookie('refresh_token', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
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
  async refresh(
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response,
  ) {
    const refreshToken = request.cookies['refresh_token'];
    
    const { accessToken, newRefreshToken, user } = await this.authService.refreshToken(refreshToken);
    
    // Set new refresh token in cookie
    response.cookie('refresh_token', newRefreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
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
  async logout(
    @Req() request: any,
    @Res({ passthrough: true }) response: Response,
  ) {
    const refreshToken = request.cookies['refresh_token'];
    
    if (refreshToken) {
      await this.authService.logout(request.user.id, refreshToken);
    }
    
    response.clearCookie('refresh_token');
    
    return {
      message: 'Logged out successfully',
    };
  }
}
