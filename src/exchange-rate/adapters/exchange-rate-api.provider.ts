import { Injectable } from '@nestjs/common'
import {
  ExchangeRate,
  ExchangeRateProvider,
} from 'src/exchange-rate/ports/exchange-rate-provider'
import { Logger } from 'src/core/logger/logger.interface'
import { NestLogger } from 'src/core/logger/implementations/nest.logger'

type LatestRatesResponse = {
  base: string
  rates: Record<string, number>
}

const API_URL = 'https://api.exchangerate-api.com/v4/latest/USD'
const REQUEST_TIMEOUT_MS = 5000

// Used only when the live API is unreachable, slow or missing the requested
// currency, per the "si la API de tasas de cambio falla, usar una tasa por
// defecto" business rule.
const FALLBACK_RATES: Record<string, number> = {
  VES: 748.79,
}

@Injectable()
export class ExchangeRateApiProvider implements ExchangeRateProvider {
  private readonly logger: Logger = new NestLogger(ExchangeRateApiProvider.name)

  async getRate(currency: string): Promise<ExchangeRate> {
    try {
      return { currency, rate: await this.fetchRate(currency) }
    } catch (error) {
      this.logger.warn(
        `Using the fallback rate for ${currency}:`,
        (error as Error).message,
      )
      return { currency, rate: this.fallbackRate(currency) }
    }
  }

  private async fetchRate(currency: string): Promise<number> {
    const response = await fetch(API_URL, {
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    })

    if (!response.ok) {
      throw new Error(`exchange rate API responded with ${response.status}`)
    }

    const body = (await response.json()) as LatestRatesResponse
    const rate = body.rates[currency]

    if (rate === undefined) {
      throw new Error(`exchange rate API did not return a rate for ${currency}`)
    }

    return rate
  }

  private fallbackRate(currency: string): number {
    const rate = FALLBACK_RATES[currency]

    if (rate === undefined) {
      throw new Error(`no fallback rate configured for ${currency}`)
    }

    return rate
  }
}
