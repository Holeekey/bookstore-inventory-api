# References

Local docs and files to read before/while adding an endpoint.

## Contracts and business rules

- [docs/01-contratos-reglas.md](../../../../docs/01-contratos-reglas.md) — data model,
  endpoint contracts and business rules (Spanish, `snake_case`; the code is `camelCase`)
- [CLAUDE.md](../../../../CLAUDE.md) — architecture, core primitives, HTTP layer, conventions

## Reference implementations

| Piece | File |
|-------|------|
| Write use case (validates, saves, returns an id) | [src/book/services/create/create-book.service.ts](../../../../src/book/services/create/create-book.service.ts) |
| Read use case (Optional → Result, 404) | [src/book/services/find-one/find-one-book.service.ts](../../../../src/book/services/find-one/find-one-book.service.ts) |
| Port + DI Symbol | [src/book/ports/book.repo.ts](../../../../src/book/ports/book.repo.ts) |
| Postgres adapter (entity mapping, Prisma error translation) | [src/book/adapters/repos/book-postgres.repo.ts](../../../../src/book/adapters/repos/book-postgres.repo.ts) |
| In-memory adapter (used by unit tests) | [src/book/adapters/repos/book-mock.repo.ts](../../../../src/book/adapters/repos/book-mock.repo.ts) |
| Controller | [src/book/controllers/book.controller.ts](../../../../src/book/controllers/book.controller.ts) |
| Module wiring | [src/book/book.module.ts](../../../../src/book/book.module.ts) |

## Core primitives

| Primitive | File |
|-----------|------|
| `Service<Input, Output>` | [src/core/service/service.ts](../../../../src/core/service/service.ts) |
| `Result<T>` | [src/core/result/result.ts](../../../../src/core/result/result.ts) |
| `Optional<T>` | [src/core/optional/optional.ts](../../../../src/core/optional/optional.ts) |
| `Exception` (code + http + message) | [src/core/exception/exception.ts](../../../../src/core/exception/exception.ts) |
| `DateProvider` | [src/core/date/ports/date-provider.ts](../../../../src/core/date/ports/date-provider.ts) |

## HTTP layer (already global, do not touch per endpoint)

- [src/core/response/interceptors/result.interceptor.ts](../../../../src/core/response/interceptors/result.interceptor.ts) — unwraps the `Result`
- [src/core/response/filters/exception.filter.ts](../../../../src/core/response/filters/exception.filter.ts) — maps the exception to its `http` status
- [src/core/logger/interceptors/logging.interceptor.ts](../../../../src/core/logger/interceptors/logging.interceptor.ts) — logs every request
- Registered in [src/app.module.ts](../../../../src/app.module.ts) via `APP_FILTER` / `APP_INTERCEPTOR`

## Tests and API collection

- [test/utils/book.fixtures.ts](../../../../test/utils/book.fixtures.ts) — `createBookInput()`, `bookEntity()`
- [test/utils/fixed-date.provider.ts](../../../../test/utils/fixed-date.provider.ts) — `FIXED_DATE`
- [postman/bookstore-inventory-api.postman_collection.json](../../../../postman/bookstore-inventory-api.postman_collection.json)
