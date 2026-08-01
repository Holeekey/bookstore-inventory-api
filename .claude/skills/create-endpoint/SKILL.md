---
name: create-endpoint
description: >
  Adds a new endpoint (use case) to this NestJS hexagonal API: port, DTOs, service,
  exception, module wiring, controller route, Postman entry and unit tests.
  Trigger: When the user asks to create, add or implement an endpoint, a route or a
  use case (create/find/update/delete/search/calculate) in src/<domain>/.
license: Apache-2.0
metadata:
  author: Holeekey
  version: '1.0'
---

## When to Use

Use this skill when:

- The user asks for a new endpoint or route (`GET /books`, `PUT /books/{id}`, ...)
- The user asks for a new use case inside an existing domain module
- An existing endpoint must be extended with a new repo query or a new business rule

---

## Workflow

Follow the steps in order. Every step is mandatory unless marked optional.

| # | Step | File |
|---|------|------|
| 1 | Read the contract for the endpoint (params, body, response, rules) | [docs/01-contratos-reglas.md](../../../docs/01-contratos-reglas.md) |
| 2 | Extend the port if the use case needs a new query | `src/<domain>/ports/<domain>.repo.ts` |
| 3 | Implement it in **both** adapters (Postgres + Mock) | `src/<domain>/adapters/repos/*.repo.ts` |
| 4 | Write the input DTO (class + class-validator) and the output type | `src/<domain>/services/<use-case>/types/{input,output}.ts` |
| 5 | Write the service (`Service<Input, Output>`) | `src/<domain>/services/<use-case>/<name>.service.ts` |
| 6 | Add the exception + its code in the enum (each one declares its HTTP status) | `src/<domain>/exceptions/` |
| 7 | Register the service as a provider | `src/<domain>/<domain>.module.ts` |
| 8 | Add the route (no logic, returns the `Result` as-is) | `src/<domain>/controllers/<domain>.controller.ts` |
| 9 | Document the **contract only** in the collection (see rule below) | [postman/](../../../postman/) |
| 10 | Add the unit test for the service | `test/unit/<domain>/services/<name>.service.spec.ts` |
| 11 | Verify: `npx tsc --noEmit`, `npm test`, `npm run format` | — |

The doc uses `snake_case` (`cost_usd`); the code exposes `camelCase` (`costUsd`).

---

## Critical Patterns

### Port types must match the entity

`Book.id` is `number`, so the port takes `number`. Never widen a signature to
`string` "because it comes from the URL" — the `ValidationPipe` coerces it first.

```ts
export interface BookRepo {
  findById(id: number): Promise<Optional<Book>>
}
```

Single-item lookups return `Optional<T>`, never a bare `null`. Writes return
`Result<T>`.

### Type-only import for the injected port

The interface is erased at compile time; without `type` the decorator metadata
emit breaks (`isolatedModules` is on).

```ts
import { BOOK_REPO, type BookRepo } from 'src/book/ports/book.repo'

constructor(@Inject(BOOK_REPO) private bookRepo: BookRepo) {}
```

### Business errors are returned, not thrown

```ts
if (!book.exists()) {
  return Result.failure(new BookNotFoundException())
}
return Result.success(book.get())
```

- `Result.success(undefined)` **throws** — a use case with nothing to return must
  still return something (`Result.success({ id })`).
- To propagate a failure while changing the generic: `return result.convertToOther()`.
- `Result`'s `info` is **not** serialized (the response envelope is bare):
  pagination metadata goes inside the service's own output type.

### The exception carries its own HTTP status

```ts
export class BookNotFoundException extends Exception {
  constructor() {
    super(BookExceptionCode.BOOK_NOT_FOUND, 404, 'The book does not exist')
  }
}
```

Add the code to `codes/<domain>-exception-codes.enum.ts` with the next free number
(`BOOK-E-001`, `BOOK-E-002`, ...). Nothing else needs wiring: `DomainExceptionFilter`
already answers with `exception.http` and `{ code, message, additionalInfo? }`.

### Postman documents the contract, never the code

The collection is the API doc for its consumers: they do not have the repo. The
`description` states what the endpoint does, its params/body and its responses —
**no class names, no file paths, no mention of services, repos or architecture**.

```
YES  "Obtiene un libro por su id. Param: id (entero, requerido).
      200 → libro completo. 404 → BOOK-E-002 si no existe."

NO   "Delega en FindOneBookService (src/book/services/find-one/...)."
```

Add one example per documented response (success + each business error), with the
real body: success is the bare value, errors are `{ code, message, additionalInfo? }`
with the status declared by the exception. Any path/query value goes in a
collection variable.

### The controller holds no logic

Pass the whole param object as the input DTO so it gets validated and coerced.

```ts
@Get(':id')
async findOne(@Param() params: FindOneBookInput) {
  return await this.findOneBook.execute(params)
}
```

Never inspect `isException()` in a controller, never set a status by hand, never
map errors there: `ResultInterceptor` unwraps and `DomainExceptionFilter` maps.

---

## Decision Tree

```
Output is the whole resource?        → export type XOutput = Book   (the entity)
Output is a subset / has metadata?   → class XOutput with class-validator decorators
Use case only writes?                → return an id: Result.success({ id })

Needs a query the port lacks?        → extend the port + BOTH adapters
Needs a new column?                  → edit prisma/schema.prisma + npm run prisma:migrate
Needs an external service?           → new port + adapter, never fetch inside the service

Duplicated resource?  → 409    Not found?         → 404
Invalid input?        → the ValidationPipe already answers 400
External API down?    → 503 (just declare super(CODE, 503, '...'))
```

---

## Code Examples

### The use case (services/find-one/find-one-book.service.ts)

```ts
import { Service } from 'src/core/service/service'
import { FindOneBookInput } from './types/input'
import { FindOneBookOutput } from './types/output'
import { Result } from 'src/core/result/result'
import { Inject, Injectable } from '@nestjs/common'
import { BOOK_REPO, type BookRepo } from 'src/book/ports/book.repo'
import { BookNotFoundException } from 'src/book/exceptions/book-not-found.exception'

@Injectable()
export class FindOneBookService implements Service<
  FindOneBookInput,
  FindOneBookOutput
> {
  constructor(@Inject(BOOK_REPO) private bookRepo: BookRepo) {}

  async execute(data: FindOneBookInput): Promise<Result<FindOneBookOutput>> {
    const book = await this.bookRepo.findById(data.id)

    if (!book.exists()) {
      return Result.failure(new BookNotFoundException())
    }

    return Result.success(book.get())
  }
}
```

### The DTOs (services/find-one/types/)

```ts
// input.ts — always a class, class-validator decorates it
import { IsInt } from 'class-validator'

export class FindOneBookInput {
  @IsInt()
  id: number
}

// output.ts — the entity itself when the endpoint returns the whole resource
import { Book } from 'src/book/entities/book'

export type FindOneBookOutput = Book
```

### The module wiring

```ts
providers: [
  { provide: BOOK_REPO, useClass: BookPostgresRepo },
  CreateBookService,
  FindOneBookService,
]
```

Inject services in the controller constructor by class, one field per use case.

---

## Conventions

- Prettier: **no semicolons**, single quotes, trailing commas
- Internal imports absolute from the root (`src/book/entities/book`); short
  relative paths only inside the same module (`./types/input`)
- `kebab-case` files with a role suffix: `.service.ts`, `.repo.ts`, `.controller.ts`,
  `.exception.ts`, `.module.ts`
- One use case = one folder under `services/`
- Commit: `feat(book): :sparkles: find one book`

---

## Commands

```bash
npx tsc --noEmit          # type-check without emitting (fastest feedback)
npm test                  # unit tests (test/unit/**/*.spec.ts)
npm run format            # prettier, run before wrapping up
npm run lint              # eslint --fix
npm run start:dev         # watch-mode server on PORT or 3000
npm run prisma:migrate    # only when the schema changed
```

---

## Resources

- **Templates**: See [assets/](assets/) for the use-case skeleton (input, output,
  service, exception, spec) and the Postman request block
- **Documentation**: See [references/](references/) for the endpoint contracts and
  the architecture guide
