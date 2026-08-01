import { Module } from '@nestjs/common'
import { BookController } from './controllers/book.controller'
import { CreateBookService } from './services/create/create-book.service'
import { BOOK_REPO } from './ports/book.repo'
import { BookMockRepo } from './adapters/repos/book-mock.repo'
import { FindOneBookService } from './services/find-one/find-one-book.service'

@Module({
  controllers: [BookController],
  providers: [
    { provide: BOOK_REPO, useClass: BookMockRepo },
    CreateBookService,
    FindOneBookService,
  ],
})
export class BookModule {}
