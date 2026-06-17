import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Request } from 'express';

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(private jwtService: JwtService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>();
    const token = this.extractTokenFromHeader(request);
    
    if (!token) {
      throw new UnauthorizedException('Authentication token is missing');
    }
    
    try {
      const payload = await this.jwtService.verifyAsync(token, {
        secret: (() => {
          const secret = process.env.JWT_SECRET;
          if (!secret || secret === 'super-secret-key-change-me-in-production') {
            if (process.env.NODE_ENV === 'production') {
              throw new Error('FATAL: JWT_SECRET environment variable is required and cannot be default placeholder in production!');
            }
          }
          return secret || 'super-secret-key-change-me-in-production';
        })(),
      });
      request['user'] = payload;
    } catch (err) {
      throw new UnauthorizedException('Invalid or expired authentication token');
    }
    return true;
  }

  private extractTokenFromHeader(request: Request): string | undefined {
    // 1. Try to extract bearer token from Authorization header
    const [type, token] = request.headers.authorization?.split(' ') ?? [];
    if (type === 'Bearer' && token) {
      return token;
    }
    // 2. Try to extract token from cookies
    const cookieHeader = request.headers.cookie;
    if (cookieHeader) {
      const tokenCookie = cookieHeader
        .split(';')
        .map(c => c.trim())
        .find(c => c.startsWith('beacon_token='));
      if (tokenCookie) {
        return tokenCookie.substring('beacon_token='.length);
      }
    }
    return undefined;
  }
}
