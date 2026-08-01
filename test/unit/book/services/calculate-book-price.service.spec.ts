import { Test, TestingModule } from '@nestjs/testing'
import { BookMockRepo } from 'src/book/adapters/repos/book-mock.repo'
import { BookNotFoundException } from 'src/book/exceptions/book-not-found.exception'
import { BookExceptionCode } from 'src/book/exceptions/codes/book-exception-codes.enum'
import { BOOK_REPO } from 'src/book/ports/book.repo'
import { CalculateBookPriceService } from 'src/book/services/calculate-price/calculate-book-price.service'
import { DATE_PROVIDER } from 'src/core/date/ports/date-provider'
import { EXCHANGE_RATE_PROVIDER } from 'src/exchange-rate/ports/exchange-rate-provider'
import { bookEntity } from 'test/utils/book.fixtures'
import { FIXED_DATE, FixedDateProvider } from 'test/utils/fixed-date.provider'
import { FixedExchangeRateProvider } from 'test/utils/fixed-exchange-rate.provider'

const CALCULATED_AT = new Date('2026-02-01T00:00:00.000Z')

describe('CalculateBookPriceService', () => {
  let service: CalculateBookPriceService
  let bookRepo: BookMockRepo

  beforeEach(async () => {
    bookRepo = new BookMockRepo()

    const moduleRef: TestingModule = await Test.createTestingModule({
      providers: [
        CalculateBookPriceService,
        { provide: BOOK_REPO, useValue: bookRepo },
        {
          provide: EXCHANGE_RATE_PROVIDER,
          useValue: new FixedExchangeRateProvider(0.85),
        },
        {
          provide: DATE_PROVIDER,
          useValue: new FixedDateProvider(CALCULATED_AT),
        },
      ],
    }).compile()

    service = moduleRef.get(CalculateBookPriceService)
  })

  it('calculates the suggested selling price with a 40% margin', async () => {
    await bookRepo.save(bookEntity({ costUsd: 15.99 }))

    const result = await service.execute({ id: 1 })

    expect(result.isException()).toBe(false)
    expect(result.unwrap()).toEqual({
      bookId: 1,
      costUsd: 15.99,
      exchangeRate: 0.85,
      costLocal: 13.59,
      marginPercentage: 40,
      sellingPriceLocal: 19.03,
      currency: 'VES',
      calculationTimestamp: CALCULATED_AT,
    })
  })

  it('persists the calculated selling price on the book', async () => {
    await bookRepo.save(bookEntity({ costUsd: 15.99 }))

    await service.execute({ id: 1 })

    const updated = await bookRepo.findById(1)
    expect(updated.get()).toMatchObject({
      sellingPriceLocal: 19.03,
      updatedAt: CALCULATED_AT,
      createdAt: FIXED_DATE,
    })
  })

  it('fails when the book does not exist', async () => {
    const result = await service.execute({ id: 99 })

    expect(result.isException()).toBe(true)
    expect(() => result.unwrap()).toThrow(BookNotFoundException)

    const exception = result.handleError((e) => e)
    expect(exception.code).toBe(BookExceptionCode.BOOK_NOT_FOUND)
    expect(exception.http).toBe(404)
  })
})
