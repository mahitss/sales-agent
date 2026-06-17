import { Controller, Post, Body, HttpCode, HttpStatus, Res, Req, UseGuards } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { RegisterDto, LoginDto, VerifyEmailDto, RequestPasswordResetDto, ResetPasswordDto } from './dto/auth.dto';
import { ThrottlerGuard } from '@nestjs/throttler';
import * as express from 'express';

@ApiTags('auth')
@UseGuards(ThrottlerGuard)
@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  private setRefreshTokenCookie(response: express.Response, token: string) {
    response.cookie('beacon_refresh_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/auth', // restrict scope of the cookie to auth routes
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days matching JWT expiration
    });
  }

  @Post('register')
  async register(@Body() dto: RegisterDto, @Res({ passthrough: true }) response: express.Response) {
    const result = await this.authService.register(dto);
    this.setRefreshTokenCookie(response, result.refreshToken);
    return {
      user: result.user,
      token: result.token,
    };
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(@Body() dto: LoginDto, @Res({ passthrough: true }) response: express.Response) {
    const result = await this.authService.login(dto);
    this.setRefreshTokenCookie(response, result.refreshToken);
    return {
      user: result.user,
      token: result.token,
    };
  }

  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  async refresh(@Req() request: express.Request, @Res({ passthrough: true }) response: express.Response) {
    const refreshToken = request.cookies['beacon_refresh_token'];
    const result = await this.authService.refresh(refreshToken);
    this.setRefreshTokenCookie(response, result.refreshToken);
    return {
      token: result.token,
    };
  }

  @Post('logout')
  @HttpCode(HttpStatus.OK)
  async logout(@Req() request: express.Request, @Res({ passthrough: true }) response: express.Response) {
    const refreshToken = request.cookies['beacon_refresh_token'];
    if (refreshToken) {
      await this.authService.revokeRefreshToken(refreshToken);
    }
    response.clearCookie('beacon_refresh_token', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/auth',
    });
    return { success: true, message: 'Logged out successfully' };
  }

  @Post('verify-email')
  @HttpCode(HttpStatus.OK)
  verifyEmail(@Body() dto: VerifyEmailDto) {
    return this.authService.verifyEmail(dto);
  }

  @Post('request-password-reset')
  @HttpCode(HttpStatus.OK)
  requestPasswordReset(@Body() dto: RequestPasswordResetDto) {
    return this.authService.requestPasswordReset(dto);
  }

  @Post('reset-password')
  @HttpCode(HttpStatus.OK)
  resetPassword(@Body() dto: ResetPasswordDto) {
    return this.authService.resetPassword(dto);
  }

  @Post('visitor-token')
  @HttpCode(HttpStatus.OK)
  generateVisitorToken(@Body() body: { businessId: string }) {
    return this.authService.generateVisitorToken(body.businessId);
  }
}
