import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
} from '@nestjs/common'
import { Response } from 'express'
import { Exception } from 'src/core/exception/exception'
import { NestLogger } from 'src/core/logger/implementations/nest.logger'
import { Logger } from 'src/core/logger/logger.interface'
import { ErrorResponse } from '../error-response'
import { httpExceptionMessage } from '../handlers/http-exception-message'

const STATUS_CODES: Record<number, string> = {
  400: 'BAD_REQUEST',
  401: 'UNAUTHORIZED',
  403: 'FORBIDDEN',
  404: 'NOT_FOUND',
  409: 'CONFLICT',
  422: 'UNPROCESSABLE_ENTITY',
  500: 'INTERNAL_ERROR',
  503: 'SERVICE_UNAVAILABLE',
}

const httpCode = (status: number): string =>
  STATUS_CODES[status] ?? `HTTP_${status}`

@Catch()
export class DomainExceptionFilter implements ExceptionFilter {
  private readonly logger: Logger = new NestLogger('Exception')

  catch(exception: unknown, host: ArgumentsHost): void {
    const response = host.switchToHttp().getResponse<Response>()
    const { status, body } = this.resolve(exception)
    response.status(status).json(body)
  }

  private resolve(exception: unknown): { status: number; body: ErrorResponse } {
    // Domain exception rethrown by Result.unwrap() inside ResultInterceptor.
    if (exception instanceof Exception) {
      return {
        status: exception.http,
        body: {
          code: exception.code,
          message: exception.message,
          additionalInfo: exception.additionalInfo,
        },
      }
    }

    // Nest's own HttpException: ValidationPipe, unknown routes, etc.
    if (exception instanceof HttpException) {
      return {
        status: exception.getStatus(),
        body: this.fromHttpException(exception),
      }
    }

    // Unexpected error: log it whole, hide the detail from the client.
    this.logger.exception(
      exception instanceof Error
        ? (exception.stack ?? exception.message)
        : String(exception),
    )
    return {
      status: 500,
      body: { code: 'INTERNAL_ERROR', message: 'Internal server error' },
    }
  }

  private fromHttpException(exception: HttpException): ErrorResponse {
    const status = exception.getStatus()
    const response = exception.getResponse()
    const code =
      typeof response === 'object' &&
      typeof (response as Record<string, unknown>).code === 'string'
        ? ((response as Record<string, unknown>).code as string)
        : httpCode(status)

    return { code, message: httpExceptionMessage(exception) }
  }
}
