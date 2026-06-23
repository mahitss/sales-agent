import {
  Injectable,
  NestMiddleware,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { RedisService } from '../redis/redis.service';

const ipCache = new Map<string, { count: number; resetTime: number }>();

@Injectable()
export class RateLimiterMiddleware implements NestMiddleware {
  private readonly logger = new Logger('RateLimiter');

  constructor(private redisService: RedisService) {}

  async use(req: Request, res: Response, next: NextFunction) {
    const ip =
      req.ip || req.headers['x-forwarded-for']?.toString() || 'unknown';
    const now = Date.now();

    const isSensitive =
      req.originalUrl.includes('/auth/login') ||
      req.originalUrl.includes('/auth/register') ||
      req.originalUrl.includes('/auth/verify-email') ||
      req.originalUrl.includes('/auth/request-password-reset') ||
      req.originalUrl.includes('/auth/reset-password') ||
      req.originalUrl.includes('/auth/2fa');

    const isChat = req.originalUrl.includes('/chat');
    const isAuth = !!req.headers.authorization;

    let limit = 100;
    if (isSensitive) {
      limit = process.env.NODE_ENV === 'production' ? 5 : 100; // Strict in production, relaxed in dev/test
    } else if (isChat) {
      limit = 30; // Max 30 requests per minute for chat/stream endpoints
    } else if (isAuth) {
      limit = 200; // Higher: authenticated users get 200 requests per minute
    } else {
      limit = 50; // Moderate: anonymous users get 50 requests per minute
    }

    const windowSec = 60;
    const category = isSensitive
      ? 'sensitive'
      : isChat
        ? 'chat'
        : isAuth
          ? 'auth'
          : 'anon';
    const redisClient = (this.redisService as any).client;

    // 1. Check for Active IP Ban
    if (redisClient) {
      try {
        const isBanned = await this.redisService.get(`ban:${ip}`);
        if (isBanned) {
          throw new HttpException(
            'This IP address has been temporarily blocked due to excessive requests. Please try again in 15 minutes.',
            HttpStatus.TOO_MANY_REQUESTS,
          );
        }
      } catch (err: any) {
        if (err instanceof HttpException) throw err;
        this.logger.error(`Redis ban check failed: ${err.message}`);
      }
    }

    // 2. Perform Rate Limiting
    let count = 0;
    let fallbackUsed = false;

    if (redisClient) {
      try {
        const rateKey = `rate-limit:${ip}:${category}`;
        const currentCount = await redisClient.incr(rateKey);
        if (currentCount === 1) {
          await redisClient.expire(rateKey, windowSec);
        }
        count = currentCount;
      } catch (err: any) {
        this.logger.error(
          `Redis rate limiting failed: ${err.message}. Falling back to in-memory.`,
        );
        fallbackUsed = true;
      }
    } else {
      fallbackUsed = true;
    }

    if (fallbackUsed) {
      // In-memory rate limiting fallback
      const cacheKey = `${ip}:${category}`;
      if (ipCache.size > 1000) {
        for (const [key, val] of ipCache.entries()) {
          if (now > val.resetTime) {
            ipCache.delete(key);
          }
        }
      }

      const record = ipCache.get(cacheKey);
      if (!record || now > record.resetTime) {
        ipCache.set(cacheKey, { count: 1, resetTime: now + windowSec * 1000 });
        count = 1;
      } else {
        record.count++;
        count = record.count;
      }
    }

    // 3. Set standard API Rate Limit Headers
    res.setHeader('X-RateLimit-Limit', limit.toString());
    res.setHeader(
      'X-RateLimit-Remaining',
      Math.max(0, limit - count).toString(),
    );

    // 4. Handle Limit Exceeded
    if (count > limit) {
      if (redisClient) {
        try {
          const violationKey = `violations:${ip}`;
          const violations = await redisClient.incr(violationKey);
          if (violations === 1) {
            await redisClient.expire(violationKey, 900); // 15 mins
          }
          if (violations >= 3) {
            await this.redisService.set(`ban:${ip}`, 'true', 900); // Ban for 15 mins
            this.logger.warn(
              `IP ${ip} temporarily banned for 15 minutes due to repeated rate limit violations.`,
            );
            throw new HttpException(
              'This IP address has been temporarily blocked due to excessive requests. Please try again in 15 minutes.',
              HttpStatus.TOO_MANY_REQUESTS,
            );
          }
        } catch (err: any) {
          if (err instanceof HttpException) throw err;
          this.logger.error(`Redis violation tracking failed: ${err.message}`);
        }
      }

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
