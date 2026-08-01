import { Module } from '@nestjs/common'
import { EXCHANGE_RATE_PROVIDER } from './ports/exchange-rate-provider'
import { ExchangeRateApiProvider } from './adapters/exchange-rate-api.provider'

@Module({
  providers: [
    { provide: EXCHANGE_RATE_PROVIDER, useClass: ExchangeRateApiProvider },
  ],
  exports: [EXCHANGE_RATE_PROVIDER],
})
export class ExchangeRateModule {}
