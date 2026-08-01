import { Service } from 'src/core/service/service'
import { FindLowStockBooksInput } from './types/input'
import { FindLowStockBooksOutput } from './types/output'
import { Result } from 'src/core/result/result'
import { Inject, Injectable } from '@nestjs/common'
import { BOOK_REPO, type BookRepo } from 'src/book/ports/book.repo'

@Injectable()
export class FindLowStockBooksService implements Service<
  FindLowStockBooksInput,
  FindLowStockBooksOutput
> {
  constructor(@Inject(BOOK_REPO) private bookRepo: BookRepo) {}

  async execute(
    data: FindLowStockBooksInput,
  ): Promise<Result<FindLowStockBooksOutput>> {
    const books = await this.bookRepo.findLowStock(data.threshold)
    return Result.success(books)
  }
}
