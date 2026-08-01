export type ExchangeRate = {
  currency: string
  rate: number
}

export interface ExchangeRateProvider {
  getRate(currency: string): Promise<ExchangeRate>
}

export const EXCHANGE_RATE_PROVIDER = Symbol('ExchangeRateProvider')
