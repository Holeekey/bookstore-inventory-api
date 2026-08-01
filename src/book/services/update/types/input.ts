import { IsInt, IsNumber, IsString, Min } from 'class-validator'

export class UpdateBookBody {
  @IsString()
  title: string

  @IsString()
  author: string

  @IsString()
  isbn: string

  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  costUsd: number

  @IsInt()
  @Min(0)
  stockQuantity: number

  @IsString()
  category: string

  @IsString()
  supplierCountry: string
}

export class UpdateBookInput extends UpdateBookBody {
  @IsInt()
  id: number
}
