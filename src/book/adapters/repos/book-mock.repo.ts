import { Book } from 'src/book/entities/book'
import { BookRepo } from 'src/book/ports/book.repo'
import { BookNotFoundException } from 'src/book/exceptions/book-not-found.exception'
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

  saveMany(books: Book[]): Promise<Result<{ created: number }>> {
    let created = 0

    for (const book of books) {
      if (this.books.some((b) => b.isbn === book.isbn)) continue
      book.id = this.books.length + 1
      this.books.push(book)
      created++
    }

    return Promise.resolve(Result.success({ created }))
  }

  deleteById(id: number): Promise<Result<{ id: number }>> {
    const index = this.books.findIndex((b) => b.id === id)
    if (index < 0) {
      return Promise.resolve(Result.failure(new BookNotFoundException()))
    }
    this.books.splice(index, 1)
    return Promise.resolve(Result.success({ id }))
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

  findByCategory(category: string): Promise<Book[]> {
    const needle = category.toLowerCase()
    return Promise.resolve(
      this.books.filter((book) => book.category.toLowerCase().includes(needle)),
    )
  }

  findLowStock(threshold: number): Promise<Book[]> {
    return Promise.resolve(
      this.books
        .filter((book) => book.stockQuantity <= threshold)
        .sort((a, b) => a.stockQuantity - b.stockQuantity),
    )
  }

  count(): Promise<number> {
    return Promise.resolve(this.books.length)
  }
}
