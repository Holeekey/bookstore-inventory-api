// src/<domain>/services/<use-case>/types/output.ts
//
// Option A — the endpoint returns the whole resource: alias the entity.
import { Book } from 'src/book/entities/book'

export type <UseCase>Output = Book

// Option B — the endpoint returns a subset, an id, or carries metadata
// (pagination lives HERE, not in Result's `info`, because the response
// envelope is bare):
//
// export class <UseCase>Output {
//   @IsInt()
//   id: number
// }
//
// export class FindManyBooksOutput {
//   books: Book[]
//   total: number
//   page: number
//   limit: number
// }
