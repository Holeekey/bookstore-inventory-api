import { Optional } from 'src/core/optional/optional'
import { Book } from '../entities/book'
import { Result } from 'src/core/result/result'

export interface BookRepo {
  save(book: Book): Promise<Result<Book>>
  deleteById(id: number): Promise<Result<{ id: number }>>
  findByIsbn(isbn: string): Promise<Optional<Book>>
  findById(id: number): Promise<Optional<Book>>
  findMany(data: { page: number; limit: number }): Promise<Book[]>
  findByCategory(category: string): Promise<Book[]>
  findLowStock(threshold: number): Promise<Book[]>
  count(): Promise<number>
}

export const BOOK_REPO = Symbol('BookRepo')
