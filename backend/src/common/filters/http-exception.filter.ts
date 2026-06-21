import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';
import * as Sentry from '@sentry/node';

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger('HttpExceptionFilter');

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const status =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

    const message =
      exception instanceof HttpException
        ? exception.getResponse()
        : { message: 'Internal server error' };

    const errorDetails =
      typeof message === 'object' ? (message as any) : { message };

    const responseBody = {
      statusCode: status,
      timestamp: new Date().toISOString(),
      path: request.url,
      message:
        errorDetails.message || errorDetails.error || 'An error occurred',
      error:
        errorDetails.error ||
        (status === HttpStatus.INTERNAL_SERVER_ERROR
          ? 'Internal Server Error'
          : undefined),
    };

    if (
      status === HttpStatus.INTERNAL_SERVER_ERROR ||
      !(exception instanceof HttpException)
    ) {
      Sentry.captureException(exception);
    }

    this.logger.error(
      `HTTP Error: ${status} [${request.method}] ${request.url} - Error: ${JSON.stringify(responseBody)}`,
      exception instanceof Error ? exception.stack : undefined,
    );

    response.status(status).json(responseBody);
  }
}
