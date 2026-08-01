import { Service } from 'src/core/service/service'
import { DeleteBookInput } from './types/input'
import { DeleteBookOutput } from './types/output'
import { Result } from 'src/core/result/result'
import { Inject, Injectable } from '@nestjs/common'
import { BOOK_REPO, type BookRepo } from 'src/book/ports/book.repo'
import { BookNotFoundException } from 'src/book/exceptions/book-not-found.exception'

@Injectable()
export class DeleteBookService implements Service<
  DeleteBookInput,
  DeleteBookOutput
> {
  constructor(@Inject(BOOK_REPO) private bookRepo: BookRepo) {}

  async execute(data: DeleteBookInput): Promise<Result<DeleteBookOutput>> {
    const existing = await this.bookRepo.findById(data.id)

    if (!existing.exists()) {
      return Result.failure(new BookNotFoundException())
    }

    const deleteResult = await this.bookRepo.deleteById(data.id)

    if (deleteResult.isException()) {
      return deleteResult.convertToOther()
    }

    return Result.success(deleteResult.unwrap())
  }
}
