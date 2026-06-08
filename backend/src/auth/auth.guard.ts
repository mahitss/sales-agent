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
          if (!secret && process.env.NODE_ENV === 'production') {
            throw new Error('FATAL: JWT_SECRET environment variable is required in production!');
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
    const [type, token] = request.headers.authorization?.split(' ') ?? [];
    return type === 'Bearer' ? token : undefined;
  }
}
