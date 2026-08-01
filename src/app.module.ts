import { Module } from '@nestjs/common'
import { BookModule } from './book/book.module'
import { UuidModule } from './core/uuid/uuid.module'
import { DateModule } from './core/date/date.module'

@Module({
  imports: [UuidModule, DateModule, BookModule],
  controllers: [],
  providers: [],
})
export class AppModule {}
