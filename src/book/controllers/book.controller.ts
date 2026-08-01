import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common'
import { CreateBookService } from '../services/create/create-book.service'
import { CreateBookInput } from '../services/create/types/input'
import { FindOneBookService } from '../services/find-one/find-one-book.service'
import { FindOneBookInput } from '../services/find-one/types/input'
import { FindManyBooksService } from '../services/find-many/find-many-books.service'
import { FindManyBooksInput } from '../services/find-many/types/input'

@Controller('books')
export class BookController {
  constructor(
    private createBook: CreateBookService,
    private findOneBook: FindOneBookService,
    private findManyBooks: FindManyBooksService,
  ) {}

  @Post()
  async create(@Body() body: CreateBookInput) {
    return await this.createBook.execute(body)
  }

  @Get()
  async findMany(@Query() query: FindManyBooksInput) {
    return await this.findManyBooks.execute(query)
  }

  @Get(':id')
  async findOne(@Param() params: FindOneBookInput) {
    return await this.findOneBook.execute(params)
  }
}
