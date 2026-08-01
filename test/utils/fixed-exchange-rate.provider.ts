import {
  ExchangeRate,
  ExchangeRateProvider,
} from 'src/exchange-rate/ports/exchange-rate-provider'

export const FIXED_EXCHANGE_RATE = 0.85

export class FixedExchangeRateProvider implements ExchangeRateProvider {
  constructor(private readonly rate: number = FIXED_EXCHANGE_RATE) {}

  getRate(currency: string): Promise<ExchangeRate> {
    return Promise.resolve({ currency, rate: this.rate })
  }
}
