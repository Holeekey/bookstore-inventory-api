import { Service } from 'src/core/service/service'
import { CreateBookInput } from './types/input'
import { CreateBookOutput } from './types/output'
import { Result } from 'src/core/result/result'
import { Inject, Injectable } from '@nestjs/common'
import { BOOK_REPO, type BookRepo } from 'src/book/ports/book.repo'
import { IsbnExistsException } from 'src/book/exceptions/isbn-exists.exception'
import * as date from 'src/core/date/ports/date-provider'
import { Book } from 'src/book/entities/book'

@Injectable()
export class CreateBookService implements Service<
  CreateBookInput,
  CreateBookOutput
> {
  constructor(
    @Inject(BOOK_REPO) private bookRepo: BookRepo,
    @Inject(date.DATE_PROVIDER)
    private dateProvider: date.DateProvider,
  ) {}

  async execute(data: CreateBookInput): Promise<Result<CreateBookOutput>> {
    const bookWithIsbn = await this.bookRepo.findByIsbn(data.isbn)

    if (bookWithIsbn.exists()) {
      return Result.failure(new IsbnExistsException())
    }

    const book: Book = {
      ...data,
      sellingPriceLocal: null,
      createdAt: this.dateProvider.get(),
      updatedAt: this.dateProvider.get(),
    }

    const saveResult = await this.bookRepo.save(book)

    if (saveResult.isException()) {
      return saveResult.convertToOther()
    }

    const finalBook = saveResult.unwrap()

    return Result.success({
      id: finalBook.id!,
    })
  }
}
