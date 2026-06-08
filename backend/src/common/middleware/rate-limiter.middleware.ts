import { Injectable, NestMiddleware, HttpException, HttpStatus } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';

const ipCache = new Map<string, { count: number; resetTime: number }>();

@Injectable()
export class RateLimiterMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction) {
    const ip = req.ip || req.headers['x-forwarded-for']?.toString() || 'unknown';
    const now = Date.now();
    const limit = 100; // 100 requests limit
    const windowMs = 60 * 1000; // 1 minute window

    const record = ipCache.get(ip);
    if (!record) {
      ipCache.set(ip, { count: 1, resetTime: now + windowMs });
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
        'Too many requests from this IP. Please try again later.',
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    next();
  }
}
