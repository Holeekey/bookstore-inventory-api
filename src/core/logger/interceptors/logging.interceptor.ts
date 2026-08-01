import {
  CallHandler,
  ExecutionContext,
  HttpException,
  Injectable,
  NestInterceptor,
} from '@nestjs/common'
import { Request } from 'express'
import { Observable, tap } from 'rxjs'
import { Exception } from 'src/core/exception/exception'
import { httpExceptionMessage } from 'src/core/response/handlers/http-exception-message'
import { NestLogger } from '../implementations/nest.logger'
import { Logger } from '../logger.interface'

// Mirrors what the client ends up receiving, so a log line explains the response.
const describe = (err: unknown): string => {
  if (err instanceof Exception) return `${err.code} ${err.message}`
  if (err instanceof HttpException) return httpExceptionMessage(err)
  if (err instanceof Error) return err.message
  return String(err)
}

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  private readonly logger: Logger = new NestLogger('HTTP')

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const req = context.switchToHttp().getRequest<Request>()
    const { method, originalUrl } = req
    const handler = `${context.getClass().name}.${context.getHandler().name}`
    const start = Date.now()

    this.logger.log(
      '[INPUT]',
      method,
      originalUrl,
      handler,
      JSON.stringify(req.body ?? {}),
    )

    return next.handle().pipe(
      tap({
        next: (body: unknown) =>
          this.logger.log(
            '[OUTPUT]',
            method,
            originalUrl,
            `${Date.now() - start}ms`,
            JSON.stringify(body),
          ),
        error: (err: unknown) =>
          this.logger.error(
            '✕',
            method,
            originalUrl,
            `${Date.now() - start}ms`,
            describe(err),
          ),
      }),
    )
  }
}
