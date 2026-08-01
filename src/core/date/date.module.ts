import { Global, Module } from '@nestjs/common'
import { DATE_PROVIDER } from './ports/date-provider'
import { CurrentDateProvider } from './adapters/current-date-provider'

@Global()
@Module({
  providers: [{ provide: DATE_PROVIDER, useClass: CurrentDateProvider }],
  exports: [DATE_PROVIDER],
})
export class DateModule {}
