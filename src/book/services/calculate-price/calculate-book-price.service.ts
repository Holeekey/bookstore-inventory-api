import { Service } from 'src/core/service/service'
import { CalculateBookPriceInput } from './types/input'
import { CalculateBookPriceOutput } from './types/output'
import { Result } from 'src/core/result/result'
import { Inject, Injectable } from '@nestjs/common'
import { BOOK_REPO, type BookRepo } from 'src/book/ports/book.repo'
import { BookNotFoundException } from 'src/book/exceptions/book-not-found.exception'
import * as date from 'src/core/date/ports/date-provider'
import {
  EXCHANGE_RATE_PROVIDER,
  type ExchangeRateProvider,
} from 'src/exchange-rate/ports/exchange-rate-provider'

// This bookstore chain operates in Venezuela: the suggested selling price is
// always expressed in the local currency, VES, regardless of supplierCountry.
const LOCAL_CURRENCY = 'VES'
const MARGIN_PERCENTAGE = 40

@Injectable()
export class CalculateBookPriceService implements Service<
  CalculateBookPriceInput,
  CalculateBookPriceOutput
> {
  constructor(
    @Inject(BOOK_REPO) private bookRepo: BookRepo,
    @Inject(EXCHANGE_RATE_PROVIDER)
    private exchangeRateProvider: ExchangeRateProvider,
    @Inject(date.DATE_PROVIDER)
    private dateProvider: date.DateProvider,
  ) {}

  async execute(
    data: CalculateBookPriceInput,
  ): Promise<Result<CalculateBookPriceOutput>> {
    const book = await this.bookRepo.findById(data.id)

    if (!book.exists()) {
      return Result.failure(new BookNotFoundException())
    }

    const { rate } = await this.exchangeRateProvider.getRate(LOCAL_CURRENCY)

    const costUsd = book.get().costUsd
    const costLocal = this.round(costUsd * rate)
    const sellingPriceLocal = this.round(
      costLocal * (1 + MARGIN_PERCENTAGE / 100),
    )
    const calculationTimestamp = this.dateProvider.get()

    const saveResult = await this.bookRepo.save({
      ...book.get(),
      sellingPriceLocal,
      updatedAt: calculationTimestamp,
    })

    if (saveResult.isException()) {
      return saveResult.convertToOther()
    }

    return Result.success({
      bookId: data.id,
      costUsd,
      exchangeRate: rate,
      costLocal,
      marginPercentage: MARGIN_PERCENTAGE,
      sellingPriceLocal,
      currency: LOCAL_CURRENCY,
      calculationTimestamp,
    })
  }

  private round(value: number): number {
    return Math.round(value * 100) / 100
  }
}
