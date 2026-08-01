import { Exception } from 'src/core/exception/exception'
import { BookExceptionCode } from './codes/book-exception-codes.enum'

export class BookNotFoundException extends Exception {
  constructor() {
    super(BookExceptionCode.BOOK_NOT_FOUND, 404, 'The book does not exist')
  }
}
