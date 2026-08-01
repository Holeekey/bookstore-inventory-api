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

docker compose up -d       # postgres 16 (host port = POSTGRES_PORT in .env)
npm run prisma:migrate     # create + apply a migration (dev)
npm run prisma:deploy      # apply pending migrations (prod)
npm run prisma:generate    # regenerate the client (also runs on postinstall)
npm run prisma:studio      # browse the data
```

Copy [.env.example](.env.example) to `.env` before running anything: it feeds both
`docker-compose.yml` (`POSTGRES_*`) and Prisma (`DATABASE_URL`).

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

`src/core/` holds the cross-cutting primitives shared by every module: `Result`, `Optional`, `Exception`, `Service`, the HTTP layer (`response/`, `logger/`), plus the global `DateModule`, `UuidModule` and `PrismaModule`.

### Core primitives (required)

- **`Service<Input, Output>`** — every use case implements `execute(data: Input): Promise<Result<Output>>`.
- **`Result<T>`** — business errors are returned, not thrown. `Result.success(v)` / `Result.failure(exception)`; `isException()`, `unwrap()`, and `convertToOther()` to propagate a failure while changing the generic type. `Result.success(undefined)` throws, so a use case with nothing to return must still return something (e.g. `Result.success({ id })`).
- **`Optional<T>`** — what repos return from single-item lookups: `exists()`, `get()`, `orElse()`. Never return a bare `null` from a port.
- **`Exception`** — abstract base carrying `code` (string like `BOOK-E-001`), `http` (the status the filter will answer with) and `message`. Every business error is its own class under `exceptions/`, and its code goes in the domain enum.
- **`DateProvider`** (`DATE_PROVIDER`) — inject it instead of calling `new Date()` directly, so services stay testable.
- **`UuidGenerator`** — globally available; `Book` ids are currently numeric and assigned by the repo.

### HTTP layer

Registered globally in [src/app.module.ts](src/app.module.ts) via `APP_FILTER` / `APP_INTERCEPTOR` (not in `main.ts`). Order matters: `LoggingInterceptor` is declared first so it wraps `ResultInterceptor` and logs the final body.

- **`ResultInterceptor`** ([src/core/response/interceptors/result.interceptor.ts](src/core/response/interceptors/result.interceptor.ts)) — knows only the happy path: `data instanceof Result ? result.unwrap() : data`. It never checks `isException()`; on a failure `unwrap()` **rethrows** the domain `Exception`, and since that happens inside an rxjs `map` it surfaces as an observable error. Anything that is not a `Result` passes through untouched.
- **`DomainExceptionFilter`** ([src/core/response/filters/exception.filter.ts](src/core/response/filters/exception.filter.ts)) — `@Catch()` with no argument. Three branches: domain `Exception` → its own `http`; Nest `HttpException` (ValidationPipe, unknown routes) → its status with the `message` array flattened; anything else → logs the stack and answers an opaque 500.
- **`LoggingInterceptor`** ([src/core/logger/interceptors/logging.interceptor.ts](src/core/logger/interceptors/logging.interceptor.ts)) — logs every request with no opt-in: `[INPUT]` with method, URL, handler and body; `[OUTPUT]` with duration and body; `✕` with duration and the error, using the same text the client receives.

**Response contract**: success returns the use-case value bare, with no envelope (201 on `@Post`, 200 elsewhere). Every error returns `{ code, message, additionalInfo? }` — domain codes (`BOOK-E-XXX`) for business errors, generic ones (`BAD_REQUEST`, `NOT_FOUND`, `INTERNAL_ERROR`) for the rest. Because the envelope is bare, `Result`'s `info` is not serialized: pagination metadata belongs inside the service's own output type.

### Dependency injection

Ports are registered through a `Symbol` exported next to the interface:

```ts
export const BOOK_REPO = Symbol('BookRepo')
```

and injected with `@Inject(BOOK_REPO) private bookRepo: BookRepo`. **The type must be imported as `import { BOOK_REPO, type BookRepo }`**: the interface is erased at compile time and without `type` the decorator metadata emit breaks (`isolatedModules` is on).

### Persistence (Prisma 7 + Postgres)

- Schema in [prisma/schema.prisma](prisma/schema.prisma), migrations in `prisma/migrations/`, CLI config in [prisma.config.ts](prisma.config.ts) (it loads `.env` through `dotenv/config`; the datasource URL is **not** in the schema).
- Prisma 7 needs a **driver adapter**: the client is built with `PrismaPg` over `DATABASE_URL`. `PrismaService` ([src/core/prisma/prisma.service.ts](src/core/prisma/prisma.service.ts)) extends `PrismaClient`, reads the URL from `ConfigService` and connects/disconnects with the Nest lifecycle. `PrismaModule` is `@Global()`, so any adapter can just inject `PrismaService`.
- The client is generated **into the source tree** (`src/generated/prisma`, gitignored, `moduleFormat = "cjs"`). It has to live under `src/` so `nest build` keeps emitting `dist/main.js`; for the same reason `prisma.config.ts` is excluded in [tsconfig.build.json](tsconfig.build.json). Run `npm run prisma:generate` after every schema change.
- The entity is not the Prisma model: `BookPostgresRepo` maps rows to `Book` in both directions (`Decimal` → `number`) so nothing outside `adapters/repos/` imports the generated types. Prisma errors are translated there too — `P2002` → `IsbnExistsException`, `P2025` → `BookNotFoundException`, anything else is rethrown so the filter answers a 500.
- Money columns are `Decimal(10,2)` / `Decimal(12,2)` and timestamps `Timestamptz(3)`; `createdAt`/`updatedAt` are set by the service through `DateProvider`, not by the database.
- `BookMockRepo` stays as the in-memory double for tests; production wiring in `book.module.ts` uses `BookPostgresRepo`.

## Code conventions

- Prettier: **no semicolons**, single quotes, trailing commas. Run `npm run format` before wrapping up a change.
- Internal imports use absolute paths from the root: `import { Book } from 'src/book/entities/book'` (avoid long relative paths). Short relative paths are fine within the same module (`../services/...`).
- Files in `kebab-case` with a role suffix: `.service.ts`, `.repo.ts`, `.controller.ts`, `.exception.ts`, `.module.ts`.
- Input DTOs are **classes** with `class-validator` decorators (not interfaces): the global `ValidationPipe` in [src/main.ts](src/main.ts) uses `whitelist` and `transform` with `enableImplicitConversion`, which is why route params (`@Param() params: FindOneBookInput`) are coerced to numbers automatically.
- Controllers hold no logic and do no error mapping: they `await this.service.execute(...)` and return the `Result` as-is. The global interceptor unwraps it and the global filter maps the failure — a controller should never inspect `isException()` nor set a status by hand.

## Adding a use case

1. Extend the port (`ports/book.repo.ts`) and its adapters (`BookPostgresRepo`, `BookMockRepo`) if needed. If it needs new columns, edit `prisma/schema.prisma` and run `npm run prisma:migrate`.
2. Create `services/<use-case>/types/input.ts` and `output.ts`.
3. Create `services/<use-case>/<name>.service.ts`, `@Injectable()`, implementing `Service<Input, Output>`.
4. Add any new exception under `exceptions/` and its code in `codes/book-exception-codes.enum.ts`. Each one declares its own HTTP status: `super(CODE, 404, 'message')`.
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

Implemented: `POST /books`, `GET /books/{id}`, duplicate-ISBN validation, error-to-HTTP mapping and request logging, **Postgres persistence through Prisma** (`BookPostgresRepo`).

Pending (per the requirements doc):

- `GET /books` (paginated — `findMany` already exists on the port), `PUT /books/{id}`, `DELETE /books/{id}`.
- `GET /books/search?category=`, `GET /books/low-stock?threshold=`.
- `POST /books/{id}/calculate-price`: rate from `https://api.exchangerate-api.com/v4/latest/USD`, 40% margin, fallback rate when the API fails (must sit behind a port + adapter, not a `fetch` inside the service). A 503 needs no extra wiring: the new exception just declares `super(CODE, 503, '...')`.
- ISBN format validation (10 or 13 digits) and `costUsd > 0` (`@Min(0)` currently accepts 0).
- Tests: there are no `*.spec.ts` files, and `test/app.e2e-spec.ts` is the Nest placeholder (it fails — it expects `GET /` → "Hello World!"). Adding unit tests first needs `"moduleDirectories": ["node_modules", "<rootDir>/.."]` in the `jest` block of `package.json`: `rootDir` is `src`, so the absolute `src/...` imports do not resolve today.
- `README.md` is still the NestJS starter readme.
