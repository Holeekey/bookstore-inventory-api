import { Service } from 'src/core/service/service'
import { FindOneBookInput } from './types/input'
import { FindOneBookOutput } from './types/output'
import { Result } from 'src/core/result/result'
import { Inject, Injectable } from '@nestjs/common'
import { BOOK_REPO, type BookRepo } from 'src/book/ports/book.repo'
import { BookNotFoundException } from 'src/book/exceptions/book-not-found.exception'

@Injectable()
export class FindOneBookService implements Service<
  FindOneBookInput,
  FindOneBookOutput
> {
  constructor(@Inject(BOOK_REPO) private bookRepo: BookRepo) {}

  async execute(data: FindOneBookInput): Promise<Result<FindOneBookOutput>> {
    const book = await this.bookRepo.findById(data.id)

    if (!book.exists()) {
      return Result.failure(new BookNotFoundException())
    }

    return Result.success(book.get())
  }
}
