import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common';
import { Observable } from 'rxjs';
import sanitizeHtml from 'sanitize-html';

@Injectable()
export class HtmlSanitizationInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    if (request.body) {
      request.body = this.sanitize(request.body);
    }
    return next.handle();
  }

  private sanitize(obj: any): any {
    if (typeof obj === 'string') {
      return sanitizeHtml(obj, {
        allowedTags: [], // Strip all HTML tags entirely by default for safety
        allowedAttributes: {},
      }).trim();
    }

    if (Array.isArray(obj)) {
      return obj.map((val) => this.sanitize(val));
    }

    if (obj !== null && typeof obj === 'object') {
      const sanitizedObj: any = {};
      for (const [key, value] of Object.entries(obj)) {
        sanitizedObj[key] = this.sanitize(value);
      }
      return sanitizedObj;
    }

    return obj;
  }
}
