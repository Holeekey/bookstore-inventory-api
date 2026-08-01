import { Optional } from 'src/core/optional/optional'
import { Book } from '../entities/book'
import { Result } from 'src/core/result/result'

export interface BookRepo {
  save(book: Book): Promise<Result<Book>>
  // Bulk insert that ignores the books whose ISBN is already stored, so a batch
  // load can be replayed without failing on the unique constraint.
  saveMany(books: Book[]): Promise<Result<{ created: number }>>
  deleteById(id: number): Promise<Result<{ id: number }>>
  findByIsbn(isbn: string): Promise<Optional<Book>>
  findById(id: number): Promise<Optional<Book>>
  findMany(data: { page: number; limit: number }): Promise<Book[]>
  findByCategory(category: string): Promise<Book[]>
  findLowStock(threshold: number): Promise<Book[]>
  count(): Promise<number>
}

export const BOOK_REPO = Symbol('BookRepo')
