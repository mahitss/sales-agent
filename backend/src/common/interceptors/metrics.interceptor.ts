import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import {
  httpRequestCounter,
  httpRequestDuration,
} from '../../metrics/metrics.controller';

@Injectable()
export class MetricsInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const response = context.switchToHttp().getResponse();
    const { method, url } = request;
    const start = Date.now();

    return next.handle().pipe(
      tap({
        next: () => {
          const duration = (Date.now() - start) / 1000;
          const routePath = request.route ? request.route.path : url;
          httpRequestCounter.inc({
            method,
            route: routePath,
            status_code: response.statusCode,
          });
          httpRequestDuration.observe({ method, route: routePath }, duration);
        },
        error: (err: any) => {
          const duration = (Date.now() - start) / 1000;
          const routePath = request.route ? request.route.path : url;
          const status = err.status || err.statusCode || 500;
          httpRequestCounter.inc({
            method,
            route: routePath,
            status_code: status,
          });
          httpRequestDuration.observe({ method, route: routePath }, duration);
        },
      }),
    );
  }
}
