// src/<domain>/services/<use-case>/types/input.ts
//
// Always a CLASS (never an interface): the global ValidationPipe reads the
// class-validator metadata. `whitelist` strips unknown fields and
// `enableImplicitConversion` coerces route params and query strings, so a
// `@Param() params: FindOneBookInput` arrives with `id` already a number.

import { IsInt, IsOptional, IsString, Min } from 'class-validator'

export class <UseCase>Input {
  @IsInt()
  id: number

  @IsString()
  someRequiredField: string

  @IsInt()
  @Min(1)
  @IsOptional()
  someOptionalField?: number
}
