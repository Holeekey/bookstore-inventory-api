import { Test, TestingModule } from '@nestjs/testing'
import { BookMockRepo } from 'src/book/adapters/repos/book-mock.repo'
import { BookNotFoundException } from 'src/book/exceptions/book-not-found.exception'
import { IsbnExistsException } from 'src/book/exceptions/isbn-exists.exception'
import { BookExceptionCode } from 'src/book/exceptions/codes/book-exception-codes.enum'
import { BOOK_REPO } from 'src/book/ports/book.repo'
import { UpdateBookService } from 'src/book/services/update/update-book.service'
import { DATE_PROVIDER } from 'src/core/date/ports/date-provider'
import { bookEntity, createBookInput } from 'test/utils/book.fixtures'
import { FIXED_DATE, FixedDateProvider } from 'test/utils/fixed-date.provider'

const UPDATED_AT = new Date('2026-02-01T00:00:00.000Z')

describe('UpdateBookService', () => {
  let service: UpdateBookService
  let bookRepo: BookMockRepo

  beforeEach(async () => {
    bookRepo = new BookMockRepo()

    const moduleRef: TestingModule = await Test.createTestingModule({
      providers: [
        UpdateBookService,
        { provide: BOOK_REPO, useValue: bookRepo },
        { provide: DATE_PROVIDER, useValue: new FixedDateProvider(UPDATED_AT) },
      ],
    }).compile()

    service = moduleRef.get(UpdateBookService)
  })

  it('updates the book and returns it', async () => {
    await bookRepo.save(bookEntity())

    const result = await service.execute({
      id: 1,
      ...createBookInput({
        title: 'Clean Architecture (2nd ed.)',
        stockQuantity: 5,
      }),
    })

    expect(result.isException()).toBe(false)
    expect(result.unwrap()).toMatchObject({
      id: 1,
      title: 'Clean Architecture (2nd ed.)',
      stockQuantity: 5,
    })
  })

  it('stamps updatedAt but keeps createdAt and sellingPriceLocal', async () => {
    await bookRepo.save(bookEntity({ sellingPriceLocal: 30 }))

    const result = await service.execute({ id: 1, ...createBookInput() })

    expect(result.unwrap()).toMatchObject({
      createdAt: FIXED_DATE,
      sellingPriceLocal: 30,
      updatedAt: UPDATED_AT,
    })
  })

  it('allows updating a book while keeping its own isbn', async () => {
    await bookRepo.save(bookEntity())

    const result = await service.execute({ id: 1, ...createBookInput() })

    expect(result.isException()).toBe(false)
  })

  it('fails when the book does not exist', async () => {
    const result = await service.execute({ id: 99, ...createBookInput() })

    expect(result.isException()).toBe(true)
    expect(() => result.unwrap()).toThrow(BookNotFoundException)

    const exception = result.handleError((e) => e)
    expect(exception.code).toBe(BookExceptionCode.BOOK_NOT_FOUND)
    expect(exception.http).toBe(404)
  })

  it('fails when the isbn belongs to another book', async () => {
    await bookRepo.save(bookEntity({ isbn: '1111111111' }))
    await bookRepo.save(bookEntity({ isbn: '2222222222' }))

    const result = await service.execute({
      id: 2,
      ...createBookInput({ isbn: '1111111111' }),
    })

    expect(result.isException()).toBe(true)
    expect(() => result.unwrap()).toThrow(IsbnExistsException)

    const exception = result.handleError((e) => e)
    expect(exception.code).toBe(BookExceptionCode.ISBN_EXISTS)
    expect(exception.http).toBe(400)
  })

  it('does not modify the book when the isbn is taken by another one', async () => {
    await bookRepo.save(bookEntity({ isbn: '1111111111', title: 'First' }))
    await bookRepo.save(bookEntity({ isbn: '2222222222', title: 'Second' }))

    await service.execute({
      id: 2,
      ...createBookInput({ isbn: '1111111111', title: 'Hijacked' }),
    })

    const untouched = await bookRepo.findById(2)
    expect(untouched.get().title).toBe('Second')
  })
})
