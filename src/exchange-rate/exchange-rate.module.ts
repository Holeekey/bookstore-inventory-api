import { Module } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { EXCHANGE_RATE_PROVIDER } from './ports/exchange-rate-provider'
import { ExchangeRateApiProvider } from './adapters/exchange-rate-api.provider'
import { DolarApiProvider } from './adapters/dolar-api.provider'

// Two adapters implement the same port; EXCHANGE_RATE_SOURCE picks one.
// `dolarapi` is the default because it publishes the official USD → VES rate
// the chain prices with, while the free plan of exchangerate-api.com does not
// list VES at all and always ends up on the fallback rate.
@Module({
  providers: [
    {
      provide: EXCHANGE_RATE_PROVIDER,
      inject: [ConfigService],
      useFactory: (config: ConfigService) =>
        config.get<string>('EXCHANGE_RATE_SOURCE') === 'exchangerate-api'
          ? new ExchangeRateApiProvider()
          : new DolarApiProvider(),
    },
  ],
  exports: [EXCHANGE_RATE_PROVIDER],
})
export class ExchangeRateModule {}
