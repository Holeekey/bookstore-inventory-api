import { IsInt } from 'class-validator'

export class DeleteBookInput {
  @IsInt()
  id: number
}
