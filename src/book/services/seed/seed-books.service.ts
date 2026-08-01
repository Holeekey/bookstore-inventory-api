import { Service } from 'src/core/service/service'
import { SeedBooksOutput } from './types/output'
import { SEED_BOOKS } from './seed-books.data'
import { Result } from 'src/core/result/result'
import { Inject, Injectable } from '@nestjs/common'
import { BOOK_REPO, type BookRepo } from 'src/book/ports/book.repo'
import * as date from 'src/core/date/ports/date-provider'
import { Book } from 'src/book/entities/book'

// The seed takes no input: the catalogue it loads is fixed (see
// seed-books.data.ts), hence `Service<void, ...>` and no input DTO.
@Injectable()
export class SeedBooksService implements Service<void, SeedBooksOutput> {
  constructor(
    @Inject(BOOK_REPO) private bookRepo: BookRepo,
    @Inject(date.DATE_PROVIDER)
    private dateProvider: date.DateProvider,
  ) {}

  async execute(): Promise<Result<SeedBooksOutput>> {
    const now = this.dateProvider.get()

    const books: Book[] = SEED_BOOKS.map((book) => ({
      ...book,
      sellingPriceLocal: null,
      createdAt: now,
      updatedAt: now,
    }))

    const saveResult = await this.bookRepo.saveMany(books)

    if (saveResult.isException()) {
      return saveResult.convertToOther()
    }

    // Books already present (same ISBN) are skipped instead of failing, so the
    // endpoint can be called again on a database that is partially seeded.
    const { created } = saveResult.unwrap()

    return Result.success({
      requested: books.length,
      created,
      skipped: books.length - created,
    })
  }
}
