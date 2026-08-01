import { IsInt, IsOptional, Min } from 'class-validator'

export class FindLowStockBooksInput {
  @IsOptional()
  @IsInt()
  @Min(0)
  threshold: number = 10
}
