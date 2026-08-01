import { Optional } from 'src/core/optional/optional'
import { Book } from '../entities/book'
import { Result } from 'src/core/result/result'

export interface BookRepo {
  save(book: Book): Promise<Result<Book>>
  findByIsbn(isbn: string): Promise<Optional<Book>>
  findById(id: number): Promise<Optional<Book>>
  findMany(data: { page: number; limit: number }): Promise<Book[]>
}

export const BOOK_REPO = Symbol('BookRepo')
