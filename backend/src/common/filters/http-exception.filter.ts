import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';

/**
 * Global HTTP exception filter.
 * - Sanitizes all error responses — NO stack traces exposed to clients.
 * - Logs full error details (including stack) server-side only.
 * - Includes requestId for traceability.
 * Requirements: 22.8
 */
@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    // Use existing request ID from header or generate a new one
    const requestId =
      (request.headers['x-request-id'] as string) ?? uuidv4();

    let status: number;
    let message: string;
    let code: string;

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const exceptionResponse = exception.getResponse();

      // Extract message from NestJS HttpException response
      if (typeof exceptionResponse === 'string') {
        message = exceptionResponse;
      } else if (
        typeof exceptionResponse === 'object' &&
        exceptionResponse !== null
      ) {
        const resp = exceptionResponse as Record<string, any>;
        message = Array.isArray(resp.message)
          ? resp.message.join(', ')
          : (resp.message ?? exception.message);
      } else {
        message = exception.message;
      }

      code = HttpStatus[status] ?? 'HTTP_ERROR';

      // Log 5xx errors with stack, 4xx as warnings
      if (status >= 500) {
        this.logger.error(
          `[${requestId}] ${request.method} ${request.url} → ${status}: ${message}`,
          exception instanceof Error ? exception.stack : undefined,
        );
      } else {
        this.logger.warn(
          `[${requestId}] ${request.method} ${request.url} → ${status}: ${message}`,
        );
      }
    } else {
      // Unknown / unhandled error — always 500, generic message to client
      status = HttpStatus.INTERNAL_SERVER_ERROR;
      message = 'Internal server error';
      code = 'INTERNAL_SERVER_ERROR';

      // Log full details server-side only
      this.logger.error(
        `[${requestId}] ${request.method} ${request.url} → 500 (unhandled)`,
        exception instanceof Error ? exception.stack : String(exception),
      );
    }

    response.status(status).json({
      error: {
        code,
        message,
        requestId,
      },
    });
  }
}
