import { Module } from '@nestjs/common'
import { BookController } from './controllers/book.controller'
import { CreateBookService } from './services/create/create-book.service'
import { BOOK_REPO } from './ports/book.repo'
import { BookPostgresRepo } from './adapters/repos/book-postgres.repo'
import { FindOneBookService } from './services/find-one/find-one-book.service'

@Module({
  controllers: [BookController],
  providers: [
    { provide: BOOK_REPO, useClass: BookPostgresRepo },
    CreateBookService,
    FindOneBookService,
  ],
})
export class BookModule {}
