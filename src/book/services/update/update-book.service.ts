import { Service } from 'src/core/service/service'
import { UpdateBookInput } from './types/input'
import { UpdateBookOutput } from './types/output'
import { Result } from 'src/core/result/result'
import { Inject, Injectable } from '@nestjs/common'
import { BOOK_REPO, type BookRepo } from 'src/book/ports/book.repo'
import { BookNotFoundException } from 'src/book/exceptions/book-not-found.exception'
import { IsbnExistsException } from 'src/book/exceptions/isbn-exists.exception'
import * as date from 'src/core/date/ports/date-provider'

@Injectable()
export class UpdateBookService implements Service<
  UpdateBookInput,
  UpdateBookOutput
> {
  constructor(
    @Inject(BOOK_REPO) private bookRepo: BookRepo,
    @Inject(date.DATE_PROVIDER)
    private dateProvider: date.DateProvider,
  ) {}

  async execute(data: UpdateBookInput): Promise<Result<UpdateBookOutput>> {
    const existing = await this.bookRepo.findById(data.id)

    if (!existing.exists()) {
      return Result.failure(new BookNotFoundException())
    }

    const bookWithIsbn = await this.bookRepo.findByIsbn(data.isbn)

    if (bookWithIsbn.exists() && bookWithIsbn.get().id !== data.id) {
      return Result.failure(new IsbnExistsException())
    }

    const saveResult = await this.bookRepo.save({
      ...existing.get(),
      title: data.title,
      author: data.author,
      isbn: data.isbn,
      costUsd: data.costUsd,
      stockQuantity: data.stockQuantity,
      category: data.category,
      supplierCountry: data.supplierCountry,
      updatedAt: this.dateProvider.get(),
    })

    if (saveResult.isException()) {
      return saveResult.convertToOther()
    }

    return Result.success(saveResult.unwrap())
  }
}
