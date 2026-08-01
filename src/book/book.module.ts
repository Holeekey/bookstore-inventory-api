import { Module } from '@nestjs/common'
import { BookController } from './controllers/book.controller'

@Module({
  controllers: [BookController],
})
export class BookModule {}
