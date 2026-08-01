import { Test, TestingModule } from '@nestjs/testing'
import { BookMockRepo } from 'src/book/adapters/repos/book-mock.repo'
import { BookNotFoundException } from 'src/book/exceptions/book-not-found.exception'
import { BookExceptionCode } from 'src/book/exceptions/codes/book-exception-codes.enum'
import { BOOK_REPO } from 'src/book/ports/book.repo'
import { DeleteBookService } from 'src/book/services/delete/delete-book.service'
import { bookEntity } from 'test/utils/book.fixtures'

describe('DeleteBookService', () => {
  let service: DeleteBookService
  let bookRepo: BookMockRepo

  beforeEach(async () => {
    bookRepo = new BookMockRepo()

    const moduleRef: TestingModule = await Test.createTestingModule({
      providers: [
        DeleteBookService,
        { provide: BOOK_REPO, useValue: bookRepo },
      ],
    }).compile()

    service = moduleRef.get(DeleteBookService)
  })

  it('deletes the book and returns its id', async () => {
    await bookRepo.save(bookEntity())

    const result = await service.execute({ id: 1 })

    expect(result.isException()).toBe(false)
    expect(result.unwrap()).toStrictEqual({ id: 1 })
  })

  it('removes the book from the repo', async () => {
    await bookRepo.save(bookEntity())

    await service.execute({ id: 1 })

    const found = await bookRepo.findById(1)
    expect(found.exists()).toBe(false)
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
