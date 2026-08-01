import { IsInt } from 'class-validator'

export class CreateBookOutput {
  @IsInt()
  id: number
}
