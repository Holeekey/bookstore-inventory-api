# CLAUDE.md

Guidance for working in this repository. Code, names and error messages are in **English**; the requirements doc is in Spanish.

## What this project is

REST API (NestJS 11 + TypeScript) to manage the inventory of a bookstore chain: book CRUD, searches, and a suggested selling price computed from an external exchange rate.

Functional requirements (data model, endpoint contracts, business rules) live in [docs/01-contratos-reglas.md](docs/01-contratos-reglas.md). **Read it before implementing any new endpoint.** Note: the doc uses `snake_case` (`cost_usd`) while the code exposes `camelCase` (`costUsd`).

## Commands

```bash
npm run start:dev     # watch mode server (PORT or 3000)
npm run build
npm run lint          # eslint --fix
npm run format        # prettier
npm test              # unit tests (jest, *.spec.ts under src/)
npm run test:e2e      # e2e (test/jest-e2e.json)
docker compose up -d  # postgres 16 (not wired to the app yet)
```

## Architecture

Hexagonal architecture per domain module. Each feature is a Nest module with this layout:

```
src/book/
  book.module.ts          # DI wiring
  entities/               # domain model (plain interfaces)
  ports/                  # infrastructure interfaces + DI Symbol
  adapters/repos/         # port implementations
  controllers/            # delegate to the service only, no logic
  services/<use-case>/    # one use case = one folder
      <name>.service.ts
      types/input.ts      # class with class-validator decorators
      types/output.ts
  exceptions/
      codes/<domain>-exception-codes.enum.ts
```

`src/core/` holds the cross-cutting primitives shared by every module: `Result`, `Optional`, `Exception`, `Service`, plus the global `DateModule` and `UuidModule`.

### Core primitives (required)

- **`Service<Input, Output>`** — every use case implements `execute(data: Input): Promise<Result<Output>>`.
- **`Result<T>`** — business errors are returned, not thrown. `Result.success(v)` / `Result.failure(exception)`; `isException()`, `unwrap()`, and `convertToOther()` to propagate a failure while changing the generic type.
- **`Optional<T>`** — what repos return from single-item lookups: `exists()`, `get()`, `orElse()`. Never return a bare `null` from a port.
- **`Exception`** — abstract base carrying `code` (string like `BOOK-E-001`) and `message`. Every business error is its own class under `exceptions/`, and its code goes in the domain enum.
- **`DateProvider`** (`DATE_PROVIDER`) — inject it instead of calling `new Date()` directly, so services stay testable.
- **`UuidGenerator`** — globally available; `Book` ids are currently numeric and assigned by the repo.

### Dependency injection

Ports are registered through a `Symbol` exported next to the interface:

```ts
export const BOOK_REPO = Symbol('BookRepo')
```

and injected with `@Inject(BOOK_REPO) private bookRepo: BookRepo`. **The type must be imported as `import { BOOK_REPO, type BookRepo }`**: the interface is erased at compile time and without `type` the decorator metadata emit breaks (`isolatedModules` is on).

## Code conventions

- Prettier: **no semicolons**, single quotes, trailing commas. Run `npm run format` before wrapping up a change.
- Internal imports use absolute paths from the root: `import { Book } from 'src/book/entities/book'` (avoid long relative paths). Short relative paths are fine within the same module (`../services/...`).
- Files in `kebab-case` with a role suffix: `.service.ts`, `.repo.ts`, `.controller.ts`, `.exception.ts`, `.module.ts`.
- Input DTOs are **classes** with `class-validator` decorators (not interfaces): the global `ValidationPipe` in [src/main.ts](src/main.ts) uses `whitelist` and `transform` with `enableImplicitConversion`, which is why route params (`@Param() params: FindOneBookInput`) are coerced to numbers automatically.
- Controllers hold no logic and do no error mapping: they `await this.service.execute(...)` and return the `Result`.

## Adding a use case

1. Extend the port (`ports/book.repo.ts`) and its adapter if needed.
2. Create `services/<use-case>/types/input.ts` and `output.ts`.
3. Create `services/<use-case>/<name>.service.ts`, `@Injectable()`, implementing `Service<Input, Output>`.
4. Add any new exception under `exceptions/` and its code in `codes/book-exception-codes.enum.ts`.
5. Register the service in `book.module.ts` and expose the endpoint in `controllers/book.controller.ts`.
6. Document the endpoint in [postman/bookstore-inventory-api.postman_collection.json](postman/bookstore-inventory-api.postman_collection.json).

## Commits

Conventional commits + gitmoji, in English, scoped `book` or `core` (see [.vscode/settings.json](.vscode/settings.json)):

```
feat(book): :sparkles: create and find one book
feat(core): :sparkles: uuid generator
```

Working branch: `development`. Main branch: `main`.

## Current state and pending work

Implemented: `POST /books`, `GET /books/{id}`, duplicate-ISBN validation, **in-memory** persistence (`BookMockRepo`).

Pending (per the requirements doc):

- `GET /books` (paginated — `findMany` already exists on the port), `PUT /books/{id}`, `DELETE /books/{id}`.
- `GET /books/search?category=`, `GET /books/low-stock?threshold=`.
- `POST /books/{id}/calculate-price`: rate from `https://api.exchangerate-api.com/v4/latest/USD`, 40% margin, fallback rate when the API fails (must sit behind a port + adapter, not a `fetch` inside the service).
- **Error-to-HTTP mapping**: a failure currently serializes as `{"exception":{"code":"BOOK-E-002"}}` with status **200**. An interceptor/filter is missing to translate `Result.failure` into 400/404/500/503 and unwrap `value` on success.
- ISBN format validation (10 or 13 digits) and `costUsd > 0` (`@Min(0)` currently accepts 0).
- Real Postgres persistence: `docker-compose.yml` brings the database up but there is no ORM or configuration; the new adapter goes in `adapters/repos/` without touching the services.
- Tests: there are no `*.spec.ts` files, and `test/app.e2e-spec.ts` is the Nest placeholder (it fails — it expects `GET /` → "Hello World!").
- `README.md` is still the NestJS starter readme.
