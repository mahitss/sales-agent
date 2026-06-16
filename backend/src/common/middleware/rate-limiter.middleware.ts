import { Injectable, NestMiddleware, HttpException, HttpStatus } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';

const ipCache = new Map<string, { count: number; resetTime: number }>();

@Injectable()
export class RateLimiterMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction) {
    const ip = req.ip || req.headers['x-forwarded-for']?.toString() || 'unknown';
    const now = Date.now();

    // Prevent memory leak by cleaning up expired entries when size is large
    if (ipCache.size > 1000) {
      for (const [key, val] of ipCache.entries()) {
        if (now > val.resetTime) {
          ipCache.delete(key);
        }
      }
    }

    const isSensitive = req.path.includes('/auth/login') || req.path.includes('/auth/register');
    const isAuth = !!req.headers.authorization;

    let limit = 100;
    if (isSensitive) {
      limit = 5; // Strict: max 5 requests per minute for login/register
    } else if (isAuth) {
      limit = 200; // Higher: authenticated users get 200 requests per minute
    } else {
      limit = 50; // Moderate: anonymous users get 50 requests per minute
    }

    const windowMs = 60 * 1000; // 1 minute window
    const cacheKey = `${ip}:${isSensitive ? 'sensitive' : isAuth ? 'auth' : 'anon'}`;

    const record = ipCache.get(cacheKey);
    if (!record) {
      ipCache.set(cacheKey, { count: 1, resetTime: now + windowMs });
      return next();
    }

    if (now > record.resetTime) {
      record.count = 1;
      record.resetTime = now + windowMs;
      return next();
    }

    record.count++;
    if (record.count > limit) {
      throw new HttpException(
        isSensitive
          ? 'Too many authentication attempts. Please try again in a minute.'
          : 'Too many requests from this client. Please try again later.',
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    next();
  }
}
