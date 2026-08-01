import { Book } from 'src/book/entities/book'
import { BookRepo } from 'src/book/ports/book.repo'
import { Optional } from 'src/core/optional/optional'
import { Result } from 'src/core/result/result'

export class BookMockRepo implements BookRepo {
  private books: Book[] = []

  save(book: Book): Promise<Result<Book>> {
    const index = this.books.findIndex((b) => b.id === book.id)
    if (index >= 0) {
      this.books[index] = book
      return Promise.resolve(Result.success(book))
    }
    book.id = this.books.length + 1
    this.books.push(book)
    return Promise.resolve(Result.success(book))
  }

  findByIsbn(isbn: string): Promise<Optional<Book>> {
    return Promise.resolve(
      Optional.of(this.books.find((book) => book.isbn === isbn)),
    )
  }

  findById(id: number): Promise<Optional<Book>> {
    return Promise.resolve(
      Optional.of(this.books.find((book) => book.id === id)),
    )
  }

  findMany(data: { page: number; limit: number }): Promise<Book[]> {
    const start = (data.page - 1) * data.limit
    return Promise.resolve(this.books.slice(start, start + data.limit))
  }

  count(): Promise<number> {
    return Promise.resolve(this.books.length)
  }
}
