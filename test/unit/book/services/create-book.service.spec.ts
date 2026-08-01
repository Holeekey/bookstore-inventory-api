import { Test, TestingModule } from '@nestjs/testing'
import { BookMockRepo } from 'src/book/adapters/repos/book-mock.repo'
import { BookExceptionCode } from 'src/book/exceptions/codes/book-exception-codes.enum'
import { IsbnExistsException } from 'src/book/exceptions/isbn-exists.exception'
import { BOOK_REPO } from 'src/book/ports/book.repo'
import { CreateBookService } from 'src/book/services/create/create-book.service'
import { DATE_PROVIDER } from 'src/core/date/ports/date-provider'
import { createBookInput } from 'test/utils/book.fixtures'
import { FIXED_DATE, FixedDateProvider } from 'test/utils/fixed-date.provider'

describe('CreateBookService', () => {
  let service: CreateBookService
  let bookRepo: BookMockRepo

  beforeEach(async () => {
    bookRepo = new BookMockRepo()

    const moduleRef: TestingModule = await Test.createTestingModule({
      providers: [
        CreateBookService,
        { provide: BOOK_REPO, useValue: bookRepo },
        { provide: DATE_PROVIDER, useValue: new FixedDateProvider() },
      ],
    }).compile()

    service = moduleRef.get(CreateBookService)
  })

  it('creates the book and returns its id', async () => {
    const input = createBookInput()

    const result = await service.execute(input)

    expect(result.isException()).toBe(false)
    expect(result.unwrap()).toEqual({ id: 1 })

    const saved = await bookRepo.findById(1)
    expect(saved.exists()).toBe(true)
    expect(saved.get()).toMatchObject({
      id: 1,
      title: input.title,
      author: input.author,
      isbn: input.isbn,
      costUsd: input.costUsd,
      stockQuantity: input.stockQuantity,
      category: input.category,
      supplierCountry: input.supplierCountry,
    })
  })

  it('creates the book with a null selling price', async () => {
    await service.execute(createBookInput())

    const saved = await bookRepo.findById(1)
    expect(saved.get().sellingPriceLocal).toBeNull()
  })

  it('stamps the timestamps with the date provider', async () => {
    await service.execute(createBookInput())

    const saved = await bookRepo.findById(1)
    expect(saved.get().createdAt).toEqual(FIXED_DATE)
    expect(saved.get().updatedAt).toEqual(FIXED_DATE)
  })

  it('assigns incremental ids to every new book', async () => {
    const first = await service.execute(createBookInput())
    const second = await service.execute(
      createBookInput({ isbn: '9780132350884' }),
    )

    expect(first.unwrap()).toEqual({ id: 1 })
    expect(second.unwrap()).toEqual({ id: 2 })
  })

  it('fails when a book with the same isbn already exists', async () => {
    const isbn = '9780134494166'
    await service.execute(createBookInput({ isbn }))

    const result = await service.execute(
      createBookInput({ isbn, title: 'Another title' }),
    )

    expect(result.isException()).toBe(true)
    expect(() => result.unwrap()).toThrow(IsbnExistsException)

    const exception = result.handleError((e) => e)
    expect(exception.code).toBe(BookExceptionCode.ISBN_EXISTS)
    expect(exception.http).toBe(400)
  })

  it('does not save anything when the isbn is duplicated', async () => {
    const isbn = '9780134494166'
    await service.execute(createBookInput({ isbn }))

    await service.execute(createBookInput({ isbn, title: 'Another title' }))

    const books = await bookRepo.findMany({ page: 1, limit: 10 })
    expect(books).toHaveLength(1)
    expect(books[0].title).toBe('Clean Architecture')
  })
})
