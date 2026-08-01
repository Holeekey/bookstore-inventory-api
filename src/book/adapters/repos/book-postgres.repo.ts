import { Injectable } from '@nestjs/common'
import { Book } from 'src/book/entities/book'
import { BookRepo } from 'src/book/ports/book.repo'
import { BookNotFoundException } from 'src/book/exceptions/book-not-found.exception'
import { IsbnExistsException } from 'src/book/exceptions/isbn-exists.exception'
import { Optional } from 'src/core/optional/optional'
import { PrismaService } from 'src/core/prisma/prisma.service'
import { Result } from 'src/core/result/result'
import { Prisma } from 'src/generated/prisma/client'

const UNIQUE_CONSTRAINT_VIOLATION = 'P2002'
const RECORD_NOT_FOUND = 'P2025'

@Injectable()
export class BookPostgresRepo implements BookRepo {
  constructor(private prisma: PrismaService) {}

  async save(book: Book): Promise<Result<Book>> {
    try {
      const row = book.id
        ? await this.prisma.book.update({
            where: { id: book.id },
            data: this.toRow(book),
          })
        : await this.prisma.book.create({ data: this.toRow(book) })

      return Result.success(this.toEntity(row))
    } catch (error) {
      return this.handleWriteError(error)
    }
  }

  async deleteById(id: number): Promise<Result<{ id: number }>> {
    try {
      await this.prisma.book.delete({ where: { id } })
      return Result.success({ id })
    } catch (error) {
      return this.handleWriteError(error)
    }
  }

  async findByIsbn(isbn: string): Promise<Optional<Book>> {
    const row = await this.prisma.book.findUnique({ where: { isbn } })
    return Optional.of(row ? this.toEntity(row) : null)
  }

  async findById(id: number): Promise<Optional<Book>> {
    const row = await this.prisma.book.findUnique({ where: { id } })
    return Optional.of(row ? this.toEntity(row) : null)
  }

  async findMany(data: { page: number; limit: number }): Promise<Book[]> {
    const rows = await this.prisma.book.findMany({
      skip: (data.page - 1) * data.limit,
      take: data.limit,
      orderBy: { id: 'asc' },
    })
    return rows.map((row) => this.toEntity(row))
  }

  async count(): Promise<number> {
    return await this.prisma.book.count()
  }

  private handleWriteError<T>(error: unknown): Result<T> {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      // `isbn` is the only unique constraint on the table, so any unique
      // violation here means another book already owns that ISBN.
      if (error.code === UNIQUE_CONSTRAINT_VIOLATION) {
        return Result.failure(new IsbnExistsException())
      }
      // The row was deleted between reading it and saving it back.
      if (error.code === RECORD_NOT_FOUND) {
        return Result.failure(new BookNotFoundException())
      }
    }
    // Anything else is infrastructure failure: let the global filter answer 500.
    throw error
  }

  private toRow(book: Book): Prisma.BookCreateInput {
    return {
      title: book.title,
      author: book.author,
      isbn: book.isbn,
      costUsd: book.costUsd,
      sellingPriceLocal: book.sellingPriceLocal,
      stockQuantity: book.stockQuantity,
      category: book.category,
      supplierCountry: book.supplierCountry,
      createdAt: book.createdAt,
      updatedAt: book.updatedAt,
    }
  }

  private toEntity(row: Prisma.BookModel): Book {
    return {
      id: row.id,
      title: row.title,
      author: row.author,
      isbn: row.isbn,
      costUsd: row.costUsd.toNumber(),
      sellingPriceLocal: row.sellingPriceLocal?.toNumber() ?? null,
      stockQuantity: row.stockQuantity,
      category: row.category,
      supplierCountry: row.supplierCountry,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    }
  }
}
