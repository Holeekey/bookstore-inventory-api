import { Body, Controller, Get, Param, Post } from '@nestjs/common'
import { CreateBookService } from '../services/create/create-book.service'
import { CreateBookInput } from '../services/create/types/input'
import { FindOneBookService } from '../services/find-one/find-one-book.service'
import { FindOneBookInput } from '../services/find-one/types/input'

@Controller('books')
export class BookController {
  constructor(
    private createBook: CreateBookService,
    private findOneBook: FindOneBookService,
  ) {}

  @Post()
  async create(@Body() body: CreateBookInput) {
    return await this.createBook.execute(body)
  }

  @Get(':id')
  async findOne(@Param() params: FindOneBookInput) {
    return await this.findOneBook.execute(params)
  }
}
