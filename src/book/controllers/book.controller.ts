import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  Query,
} from '@nestjs/common'
import { CreateBookService } from '../services/create/create-book.service'
import { CreateBookInput } from '../services/create/types/input'
import { FindOneBookService } from '../services/find-one/find-one-book.service'
import { FindOneBookInput } from '../services/find-one/types/input'
import { FindManyBooksService } from '../services/find-many/find-many-books.service'
import { FindManyBooksInput } from '../services/find-many/types/input'
import { UpdateBookService } from '../services/update/update-book.service'
import { UpdateBookBody } from '../services/update/types/input'
import { DeleteBookService } from '../services/delete/delete-book.service'
import { DeleteBookInput } from '../services/delete/types/input'

@Controller('books')
export class BookController {
  constructor(
    private createBook: CreateBookService,
    private findOneBook: FindOneBookService,
    private findManyBooks: FindManyBooksService,
    private updateBook: UpdateBookService,
    private deleteBook: DeleteBookService,
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

  @Put(':id')
  async update(
    @Param() params: FindOneBookInput,
    @Body() body: UpdateBookBody,
  ) {
    return await this.updateBook.execute({ ...body, id: params.id })
  }

  @Delete(':id')
  async delete(@Param() params: DeleteBookInput) {
    return await this.deleteBook.execute(params)
  }
}
