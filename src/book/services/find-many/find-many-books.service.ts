import { Service } from 'src/core/service/service'
import { FindManyBooksInput } from './types/input'
import { FindManyBooksOutput } from './types/output'
import { Result } from 'src/core/result/result'
import { Inject, Injectable } from '@nestjs/common'
import { BOOK_REPO, type BookRepo } from 'src/book/ports/book.repo'

@Injectable()
export class FindManyBooksService implements Service<
  FindManyBooksInput,
  FindManyBooksOutput
> {
  constructor(@Inject(BOOK_REPO) private bookRepo: BookRepo) {}

  async execute(
    data: FindManyBooksInput,
  ): Promise<Result<FindManyBooksOutput>> {
    const [books, total] = await Promise.all([
      this.bookRepo.findMany({ page: data.page, limit: data.limit }),
      this.bookRepo.count(),
    ])

    return Result.success({
      books,
      total,
      page: data.page,
      limit: data.limit,
    })
  }
}
