import { Test, TestingModule } from '@nestjs/testing'
import { BookMockRepo } from 'src/book/adapters/repos/book-mock.repo'
import { BOOK_REPO } from 'src/book/ports/book.repo'
import { SeedBooksService } from 'src/book/services/seed/seed-books.service'
import { SEED_BOOKS } from 'src/book/services/seed/seed-books.data'
import { DATE_PROVIDER } from 'src/core/date/ports/date-provider'
import { bookEntity } from 'test/utils/book.fixtures'
import { FIXED_DATE, FixedDateProvider } from 'test/utils/fixed-date.provider'

describe('SeedBooksService', () => {
  let service: SeedBooksService
  let bookRepo: BookMockRepo

  beforeEach(async () => {
    bookRepo = new BookMockRepo()

    const moduleRef: TestingModule = await Test.createTestingModule({
      providers: [
        SeedBooksService,
        { provide: BOOK_REPO, useValue: bookRepo },
        { provide: DATE_PROVIDER, useValue: new FixedDateProvider() },
      ],
    }).compile()

    service = moduleRef.get(SeedBooksService)
  })

  it('seeds the 50 books of the catalogue', async () => {
    const result = await service.execute()

    expect(result.isException()).toBe(false)
    expect(result.unwrap()).toEqual({ requested: 50, created: 50, skipped: 0 })
    expect(await bookRepo.count()).toBe(50)
  })

  it('saves every book with a null selling price and the provider timestamps', async () => {
    await service.execute()

    const books = await bookRepo.findMany({ page: 1, limit: 50 })
    expect(books).toHaveLength(50)
    for (const book of books) {
      expect(book.sellingPriceLocal).toBeNull()
      expect(book.createdAt).toEqual(FIXED_DATE)
      expect(book.updatedAt).toEqual(FIXED_DATE)
    }
  })

  it('saves the catalogue data as it is declared', async () => {
    await service.execute()

    const books = await bookRepo.findMany({ page: 1, limit: 50 })
    expect(books.map((book) => book.isbn)).toEqual(
      SEED_BOOKS.map((book) => book.isbn),
    )
    expect(books[0]).toMatchObject(SEED_BOOKS[0])
  })

  it('is idempotent: a second run creates nothing and skips everything', async () => {
    await service.execute()

    const result = await service.execute()

    expect(result.unwrap()).toEqual({ requested: 50, created: 0, skipped: 50 })
    expect(await bookRepo.count()).toBe(50)
  })

  it('only creates the books whose isbn is missing', async () => {
    await bookRepo.save(bookEntity({ isbn: SEED_BOOKS[0].isbn }))

    const result = await service.execute()

    expect(result.unwrap()).toEqual({ requested: 50, created: 49, skipped: 1 })
    expect(await bookRepo.count()).toBe(50)
  })

  it('declares a catalogue of 50 valid, non repeated books', () => {
    expect(SEED_BOOKS).toHaveLength(50)
    expect(new Set(SEED_BOOKS.map((book) => book.isbn)).size).toBe(50)

    for (const book of SEED_BOOKS) {
      expect(book.isbn).toMatch(/^\d{13}$/)
      expect(book.costUsd).toBeGreaterThan(0)
      expect(Number(book.costUsd.toFixed(2))).toBe(book.costUsd)
      expect(book.stockQuantity).toBeGreaterThanOrEqual(0)
      expect(Number.isInteger(book.stockQuantity)).toBe(true)
      expect(book.title).not.toHaveLength(0)
      expect(book.author).not.toHaveLength(0)
      expect(book.category).not.toHaveLength(0)
      expect(book.supplierCountry).toMatch(/^[A-Z]{2}$/)
    }
  })

  it('includes low stock books so the low-stock endpoint has data', async () => {
    await service.execute()

    const lowStock = await bookRepo.findLowStock(10)
    expect(lowStock.length).toBeGreaterThan(0)
  })
})
