import { Book } from 'src/book/entities/book'
import { CreateBookInput } from 'src/book/services/create/types/input'
import { FIXED_DATE } from './fixed-date.provider'

export function createBookInput(
  overrides: Partial<CreateBookInput> = {},
): CreateBookInput {
  return {
    title: 'Clean Architecture',
    author: 'Robert C. Martin',
    isbn: '9780134494166',
    costUsd: 25.5,
    stockQuantity: 10,
    category: 'Software',
    supplierCountry: 'US',
    ...overrides,
  }
}

export function bookEntity(overrides: Partial<Book> = {}): Book {
  return {
    ...createBookInput(),
    sellingPriceLocal: null,
    createdAt: FIXED_DATE,
    updatedAt: FIXED_DATE,
    ...overrides,
  }
}
