import { Test, TestingModule } from '@nestjs/testing'
import { BookMockRepo } from 'src/book/adapters/repos/book-mock.repo'
import { BOOK_REPO } from 'src/book/ports/book.repo'
import { FindLowStockBooksService } from 'src/book/services/low-stock/find-low-stock-books.service'
import { bookEntity } from 'test/utils/book.fixtures'

describe('FindLowStockBooksService', () => {
  let service: FindLowStockBooksService
  let bookRepo: BookMockRepo

  beforeEach(async () => {
    bookRepo = new BookMockRepo()

    const moduleRef: TestingModule = await Test.createTestingModule({
      providers: [
        FindLowStockBooksService,
        { provide: BOOK_REPO, useValue: bookRepo },
      ],
    }).compile()

    service = moduleRef.get(FindLowStockBooksService)
  })

  it('returns only the books at or below the threshold, sorted ascending', async () => {
    await bookRepo.save(bookEntity({ isbn: '1111111111', stockQuantity: 20 }))
    await bookRepo.save(bookEntity({ isbn: '2222222222', stockQuantity: 3 }))
    await bookRepo.save(bookEntity({ isbn: '3333333333', stockQuantity: 8 }))

    const result = await service.execute({ threshold: 10 })

    expect(result.isException()).toBe(false)
    expect(result.unwrap().map((book) => book.stockQuantity)).toEqual([3, 8])
  })

  it('defaults the threshold to 10 when not provided', async () => {
    const result = await service.execute({ threshold: 10 })

    expect(result.isException()).toBe(false)
    expect(result.unwrap()).toEqual([])
  })
})
