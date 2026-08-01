import { Test, TestingModule } from '@nestjs/testing'
import { BookMockRepo } from 'src/book/adapters/repos/book-mock.repo'
import { BookNotFoundException } from 'src/book/exceptions/book-not-found.exception'
import { BookExceptionCode } from 'src/book/exceptions/codes/book-exception-codes.enum'
import { BOOK_REPO } from 'src/book/ports/book.repo'
import { FindOneBookService } from 'src/book/services/find-one/find-one-book.service'
import { bookEntity } from 'test/utils/book.fixtures'
import { FIXED_DATE } from 'test/utils/fixed-date.provider'

describe('FindOneBookService', () => {
  let service: FindOneBookService
  let bookRepo: BookMockRepo

  beforeEach(async () => {
    bookRepo = new BookMockRepo()

    const moduleRef: TestingModule = await Test.createTestingModule({
      providers: [
        FindOneBookService,
        { provide: BOOK_REPO, useValue: bookRepo },
      ],
    }).compile()

    service = moduleRef.get(FindOneBookService)
  })

  it('returns the whole book when it exists', async () => {
    await bookRepo.save(bookEntity())

    const result = await service.execute({ id: 1 })

    expect(result.isException()).toBe(false)
    expect(result.unwrap()).toEqual({
      id: 1,
      title: 'Clean Architecture',
      author: 'Robert C. Martin',
      isbn: '9780134494166',
      costUsd: 25.5,
      sellingPriceLocal: null,
      stockQuantity: 10,
      category: 'Software',
      supplierCountry: 'US',
      createdAt: FIXED_DATE,
      updatedAt: FIXED_DATE,
    })
  })

  it('fails when the id does not exist', async () => {
    await bookRepo.save(bookEntity())

    const result = await service.execute({ id: 99 })

    expect(result.isException()).toBe(true)
    expect(() => result.unwrap()).toThrow(BookNotFoundException)

    const exception = result.handleError((e) => e)
    expect(exception.code).toBe(BookExceptionCode.BOOK_NOT_FOUND)
    expect(exception.http).toBe(404)
  })

  it('fails when there are no books at all', async () => {
    const result = await service.execute({ id: 1 })

    expect(result.isException()).toBe(true)
    expect(() => result.unwrap()).toThrow(BookNotFoundException)
  })

  it('returns the requested book when there are several', async () => {
    await bookRepo.save(bookEntity({ isbn: '1111111111', title: 'First' }))
    await bookRepo.save(bookEntity({ isbn: '2222222222', title: 'Second' }))
    await bookRepo.save(bookEntity({ isbn: '3333333333', title: 'Third' }))

    const result = await service.execute({ id: 2 })

    expect(result.unwrap()).toMatchObject({
      id: 2,
      title: 'Second',
      isbn: '2222222222',
    })
  })
})
