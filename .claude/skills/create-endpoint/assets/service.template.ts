// src/<domain>/services/<use-case>/<name>.service.ts

import { Service } from 'src/core/service/service'
import { <UseCase>Input } from './types/input'
import { <UseCase>Output } from './types/output'
import { Result } from 'src/core/result/result'
import { Inject, Injectable } from '@nestjs/common'
// The `type` keyword is REQUIRED: the interface is erased at compile time and
// without it the decorator metadata emit breaks (`isolatedModules` is on).
import { BOOK_REPO, type BookRepo } from 'src/book/ports/book.repo'
import { <Domain>NotFoundException } from 'src/book/exceptions/<domain>-not-found.exception'
// Inject the provider instead of calling `new Date()`, so the service stays testable.
import * as date from 'src/core/date/ports/date-provider'

@Injectable()
export class <UseCase>Service implements Service<
  <UseCase>Input,
  <UseCase>Output
> {
  constructor(
    @Inject(BOOK_REPO) private bookRepo: BookRepo,
    @Inject(date.DATE_PROVIDER)
    private dateProvider: date.DateProvider,
  ) {}

  async execute(data: <UseCase>Input): Promise<Result<<UseCase>Output>> {
    // 1. Load what the rule needs. Single-item lookups return Optional<T>.
    const book = await this.bookRepo.findById(data.id)

    // 2. Business errors are RETURNED, never thrown.
    if (!book.exists()) {
      return Result.failure(new <Domain>NotFoundException())
    }

    // 3. Write through the port. Propagate its failure unchanged.
    const saveResult = await this.bookRepo.save({
      ...book.get(),
      updatedAt: this.dateProvider.get(),
    })

    if (saveResult.isException()) {
      return saveResult.convertToOther()
    }

    // 4. `Result.success(undefined)` throws: always return something.
    return Result.success(saveResult.unwrap())
  }
}
