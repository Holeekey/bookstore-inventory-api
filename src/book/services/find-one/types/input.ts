import { IsInt } from 'class-validator'

export class FindOneBookInput {
  @IsInt()
  id: number
}
