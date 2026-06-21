import { Injectable, NestMiddleware, Logger } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import * as crypto from 'crypto';

@Injectable()
export class RequestLoggerMiddleware implements NestMiddleware {
  private readonly logger = new Logger('HTTP');

  use(req: Request, res: Response, next: NextFunction) {
    const start = Date.now();

    // Extract or generate unique Request ID
    const requestId =
      req.headers['x-request-id'] ||
      req.headers['x-correlation-id'] ||
      crypto.randomUUID();
    req.headers['x-request-id'] = requestId;
    res.setHeader('x-request-id', requestId);

    res.on('finish', () => {
      const duration = Date.now() - start;
      const { method, originalUrl, ip } = req;
      const statusCode = res.statusCode;
      const userAgent = req.headers['user-agent'] || '';

      const logObject = {
        timestamp: new Date().toISOString(),
        level: statusCode >= 400 ? 'ERROR' : 'INFO',
        message: `${method} ${originalUrl} ${statusCode} - ${duration}ms`,
        requestId,
        method,
        url: originalUrl,
        statusCode,
        durationMs: duration,
        ip,
        userAgent,
      };

      // Print structured JSON logs
      console.log(JSON.stringify(logObject));
    });

    next();
  }
}
