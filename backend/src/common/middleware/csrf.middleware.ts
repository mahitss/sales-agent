import {
  Injectable,
  NestMiddleware,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import * as crypto from 'crypto';

@Injectable()
export class CsrfMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction) {
    // Generate CSRF token if not present in cookies
    let xsrfToken = req.cookies['XSRF-TOKEN'];
    if (!xsrfToken) {
      xsrfToken = crypto.randomBytes(32).toString('hex');
      res.cookie('XSRF-TOKEN', xsrfToken, {
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
        httpOnly: false, // Must be readable by client script/axios
      });
    }

    // Exclude read-only methods
    if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) {
      return next();
    }

    // Exclude JWT authenticated requests from CSRF (they send Authorization Bearer headers, not cookie-based auth, making them CSRF-safe)
    if (req.headers.authorization?.startsWith('Bearer ')) {
      return next();
    }

    // Exclude public chat widget, auth routes, and external incoming webhooks (e.g., Stripe)
    const excludedPaths = [
      '/auth/login',
      '/auth/register',
      '/auth/verify-email',
      '/auth/request-password-reset',
      '/auth/reset-password',
      '/auth/visitor-token',
      '/chat',
      '/chat/stream',
      '/chat/simulate-incoming',
      '/leads',
      '/track-visitor',
      '/visitor-token',
      '/channels',
      '/stripe',
    ];

    const isExcluded = excludedPaths.some((path) => req.originalUrl.includes(path));
    if (isExcluded) {
      return next();
    }

    // Double-submit validation
    const headerToken =
      req.headers['x-xsrf-token'] || req.headers['x-csrf-token'];

    if (!xsrfToken || !headerToken || xsrfToken !== headerToken) {
      throw new HttpException(
        'Invalid or missing CSRF token',
        HttpStatus.FORBIDDEN,
      );
    }

    next();
  }
}
