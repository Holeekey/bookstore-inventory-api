import { Module } from '@nestjs/common'
import { ConfigModule } from '@nestjs/config'
import { APP_FILTER, APP_INTERCEPTOR } from '@nestjs/core'
import { BookModule } from './book/book.module'
import { UuidModule } from './core/uuid/uuid.module'
import { DateModule } from './core/date/date.module'
import { PrismaModule } from './core/prisma/prisma.module'
import { LoggingInterceptor } from './core/logger/interceptors/logging.interceptor'
import { DomainExceptionFilter } from './core/response/filters/exception.filter'
import { ResultInterceptor } from './core/response/interceptors/result.interceptor'

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    UuidModule,
    DateModule,
    PrismaModule,
    BookModule,
  ],
  controllers: [],
  providers: [
    { provide: APP_FILTER, useClass: DomainExceptionFilter },
    // Order matters: LoggingInterceptor is outermost (logs the final body),
    // ResultInterceptor is inner and unwraps the Result the handler returned.
    { provide: APP_INTERCEPTOR, useClass: LoggingInterceptor },
    { provide: APP_INTERCEPTOR, useClass: ResultInterceptor },
  ],
})
export class AppModule {}
