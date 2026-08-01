// test/unit/<domain>/services/<name>.service.spec.ts
//
// Unit-test the service against BookMockRepo (never Postgres) and the fixtures
// in test/utils/. Assert on the Result, not on thrown errors.

import { Test, TestingModule } from '@nestjs/testing'
import { BookMockRepo } from 'src/book/adapters/repos/book-mock.repo'
import { BookNotFoundException } from 'src/book/exceptions/book-not-found.exception'
import { BookExceptionCode } from 'src/book/exceptions/codes/book-exception-codes.enum'
import { BOOK_REPO } from 'src/book/ports/book.repo'
import { <UseCase>Service } from 'src/book/services/<use-case>/<name>.service'
import { bookEntity } from 'test/utils/book.fixtures'

describe('<UseCase>Service', () => {
  let service: <UseCase>Service
  let bookRepo: BookMockRepo

  beforeEach(async () => {
    bookRepo = new BookMockRepo()

    const moduleRef: TestingModule = await Test.createTestingModule({
      providers: [
        <UseCase>Service,
        { provide: BOOK_REPO, useValue: bookRepo },
        // Add { provide: DATE_PROVIDER, useValue: fixedDateProvider } when the
        // service injects DateProvider (see test/utils/fixed-date.provider.ts).
      ],
    }).compile()

    service = moduleRef.get(<UseCase>Service)
  })

  it('succeeds on the happy path', async () => {
    await bookRepo.save(bookEntity())

    const result = await service.execute({ id: 1 })

    expect(result.isException()).toBe(false)
    expect(result.unwrap()).toMatchObject({ id: 1 })
  })

  it('fails with the domain exception and its http status', async () => {
    const result = await service.execute({ id: 99 })

    expect(result.isException()).toBe(true)
    expect(() => result.unwrap()).toThrow(BookNotFoundException)

    const exception = result.handleError((e) => e)
    expect(exception.code).toBe(BookExceptionCode.BOOK_NOT_FOUND)
    expect(exception.http).toBe(404)
  })
})
