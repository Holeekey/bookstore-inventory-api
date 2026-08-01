import { IsInt } from 'class-validator'

export class DeleteBookOutput {
  @IsInt()
  id: number
}
