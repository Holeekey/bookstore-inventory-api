import { Book } from 'src/book/entities/book'

export class FindManyBooksOutput {
  books: Book[]
  total: number
  page: number
  limit: number
}
