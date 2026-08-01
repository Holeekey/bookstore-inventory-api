import { IsNotEmpty, IsString } from 'class-validator'

export class SearchBooksByCategoryInput {
  @IsString()
  @IsNotEmpty()
  category: string
}
