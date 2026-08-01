import { Service } from 'src/core/service/service'
import { SearchBooksByCategoryInput } from './types/input'
import { SearchBooksByCategoryOutput } from './types/output'
import { Result } from 'src/core/result/result'
import { Inject, Injectable } from '@nestjs/common'
import { BOOK_REPO, type BookRepo } from 'src/book/ports/book.repo'

@Injectable()
export class SearchBooksByCategoryService implements Service<
  SearchBooksByCategoryInput,
  SearchBooksByCategoryOutput
> {
  constructor(@Inject(BOOK_REPO) private bookRepo: BookRepo) {}

  async execute(
    data: SearchBooksByCategoryInput,
  ): Promise<Result<SearchBooksByCategoryOutput>> {
    const books = await this.bookRepo.findByCategory(data.category)
    return Result.success(books)
  }
}
