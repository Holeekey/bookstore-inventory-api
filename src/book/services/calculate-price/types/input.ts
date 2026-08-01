import { IsInt } from 'class-validator'

export class CalculateBookPriceInput {
  @IsInt()
  id: number
}
