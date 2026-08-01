import { Controller, Get } from '@nestjs/common'

@Controller('books')
export class BookController {
  constructor() {}

  @Get()
  test(): string {
    return 'test'
  }
}
