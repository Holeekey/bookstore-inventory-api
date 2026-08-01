// src/<domain>/exceptions/<name>.exception.ts
//
// One class per business error. The second argument is the HTTP status the
// global DomainExceptionFilter will answer with — no extra wiring needed.

import { Exception } from 'src/core/exception/exception'
import { BookExceptionCode } from './codes/book-exception-codes.enum'

export class <Name>Exception extends Exception {
  constructor() {
    super(BookExceptionCode.<CODE>, 404, 'The book does not exist')
  }
}

// src/<domain>/exceptions/codes/<domain>-exception-codes.enum.ts
// Add the next free number, never reuse one:
//
// export enum BookExceptionCode {
//   ISBN_EXISTS = 'BOOK-E-001',
//   BOOK_NOT_FOUND = 'BOOK-E-002',
//   <CODE> = 'BOOK-E-003',
// }
