import { Exception } from 'src/core/exception/exception'
import { BookExceptionCode } from './codes/book-exception-codes.enum'

export class IsbnExistsException extends Exception {
  constructor() {
    super(
      BookExceptionCode.ISBN_EXISTS,
      400,
      'A book with that ISBN code already exists',
    )
  }
}
