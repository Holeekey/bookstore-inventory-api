import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common'
import { map, Observable } from 'rxjs'
import { Result } from 'src/core/result/result'
import { successResponseHandler } from '../handlers/success-response-handler'

@Injectable()
export class ResultInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    return next
      .handle()
      .pipe(
        map((data: unknown) =>
          data instanceof Result ? successResponseHandler<unknown>(data) : data,
        ),
      )
  }
}
