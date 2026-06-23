import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { RedisService } from '../common/redis/redis.service';
import { PrismaService } from '../prisma/prisma.service';
import { Request } from 'express';
import * as crypto from 'crypto';

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(
    private jwtService: JwtService,
    private redisService: RedisService,
    private prisma: PrismaService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>();
    const token = this.extractTokenFromHeader(request);

    if (!token) {
      throw new UnauthorizedException('Authentication token is missing');
    }

    try {
      const hashedToken = crypto
          .createHash('sha256')
          .update(token)
          .digest('hex');
      const isBlacklisted = await this.redisService.get(
          `blacklist:${hashedToken}`,
      );
      if (isBlacklisted) {
        throw new UnauthorizedException(
            'Authentication token has been revoked',
        );
      }
    } catch (err) {
      // Ignore blacklist lookup errors to keep app functioning if Redis is down
    }

    try {
      const payload = await this.jwtService.verifyAsync(token, {
        secret: (() => {
          const secret = process.env.JWT_SECRET;
          if (
              !secret ||
              secret === 'super-secret-key-change-me-in-production'
          ) {
            if (process.env.NODE_ENV === 'production') {
              throw new Error(
                  'FATAL: JWT_SECRET environment variable is required and cannot be default placeholder in production!',
              );
            }
          }
          return secret || 'super-secret-key-change-me-in-production';
        })(),
      });

      // Dynamically resolve and attach businessId to request user context
      try {
        const dbUser = await this.prisma.user.findUnique({
          where: { id: payload.sub },
          select: { id: true, role: true, businessId: true },
        });
        if (dbUser) {
          let resolvedBusinessId = dbUser.businessId;
          if (dbUser.role === 'ADMIN') {
            const ownedBusiness = await this.prisma.business.findFirst({
              where: { ownerId: dbUser.id },
              select: { id: true },
            });
            if (ownedBusiness) {
              resolvedBusinessId = ownedBusiness.id;
            }
          }
          payload.businessId = resolvedBusinessId;
        }
      } catch (err) {
        // Log but do not block request if database connection transiently fails
      }

      request['user'] = payload;
    } catch (err) {
      throw new UnauthorizedException(
          'Invalid or expired authentication token',
      );
    }
    return true;
  }

  private extractTokenFromHeader(request: Request): string | undefined {
    // 1. Try to extract bearer token from Authorization header
    const [type, token] = request.headers.authorization?.split(' ') ?? [];
    if (type === 'Bearer' && token) {
      return token;
    }
    // 2. Try to extract token from query parameters (e.g. for window.open file downloads)
    const queryToken = request.query?.token;
    if (queryToken && typeof queryToken === 'string') {
      return queryToken;
    }
    // 3. Try to extract token from cookies
    const cookieHeader = request.headers.cookie;
    if (cookieHeader) {
      const tokenCookie = cookieHeader
        .split(';')
        .map((c) => c.trim())
        .find((c) => c.startsWith('beacon_token='));
      if (tokenCookie) {
        return tokenCookie.substring('beacon_token='.length);
      }
    }
    return undefined;
  }
}
