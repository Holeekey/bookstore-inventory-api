import { Injectable } from '@nestjs/common'
import {
  ExchangeRate,
  ExchangeRateProvider,
} from 'src/exchange-rate/ports/exchange-rate-provider'
import { Logger } from 'src/core/logger/logger.interface'
import { NestLogger } from 'src/core/logger/implementations/nest.logger'

type OfficialDollarResponse = {
  moneda: string
  fuente: string
  nombre: string
  compra: number | null
  venta: number | null
  promedio: number | null
  fechaActualizacion: string
}

const API_URL = 'https://ve.dolarapi.com/v1/dolares/oficial'
const REQUEST_TIMEOUT_MS = 5000

// The endpoint publishes the official BCV rate, which is a single USD → VES
// quote, so this adapter can only answer for VES.
const SUPPORTED_CURRENCY = 'VES'

// Used only when the live API is unreachable, slow or missing the rate, per the
// "si la API de tasas de cambio falla, usar una tasa por defecto" business rule.
const FALLBACK_RATE = 746.63

@Injectable()
export class DolarApiProvider implements ExchangeRateProvider {
  private readonly logger: Logger = new NestLogger(DolarApiProvider.name)

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
    if (currency !== SUPPORTED_CURRENCY) {
      throw new Error(`dolarapi only publishes ${SUPPORTED_CURRENCY} rates`)
    }

    const response = await fetch(API_URL, {
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    })

    if (!response.ok) {
      throw new Error(`dolarapi responded with ${response.status}`)
    }

    const body = (await response.json()) as OfficialDollarResponse
    // `compra` and `venta` come back null for the official rate: the published
    // value lives in `promedio`.
    const rate = body.promedio ?? body.venta

    if (typeof rate !== 'number' || rate <= 0) {
      throw new Error(`dolarapi did not return a rate for ${currency}`)
    }

    return rate
  }

  private fallbackRate(currency: string): number {
    if (currency !== SUPPORTED_CURRENCY) {
      throw new Error(`no fallback rate configured for ${currency}`)
    }

    return FALLBACK_RATE
  }
}
