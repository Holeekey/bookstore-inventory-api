# Bookstore Inventory API

API REST para gestionar el inventario de una cadena de librerías: CRUD de libros,
búsquedas y cálculo del precio de venta sugerido a partir de una tasa de cambio
externa.

Stack: **NestJS 11** + **TypeScript 5.7** + **Prisma 7** + **PostgreSQL 16**,
con arquitectura hexagonal por módulo de dominio.

- Colección Postman: [postman/bookstore-inventory-api.postman_collection.json](postman/bookstore-inventory-api.postman_collection.json)

---

## Requisitos previos

| Requisito      | Versión            | Notas                                                               |
| -------------- | ------------------ | ------------------------------------------------------------------- |
| **Node.js**    | 22 LTS (mínimo 20) | NestJS 11 requiere Node ≥ 20. La imagen Docker usa `node:22-alpine` |
| **npm**        | 10+                | Incluido con Node 22                                                |
| **Docker**     | 24+ con Compose v2 | Solo para levantar PostgreSQL (o la API completa)                   |
| **PostgreSQL** | 16                 | Únicamente si prefieres no usar Docker                              |

Comprueba tu entorno:

```bash
node -v      # v22.x
npm -v       # 10.x
docker --version
```

**Conexión a internet**: el cálculo de precio consulta la API de tasas de
cambio configurada (por defecto `https://ve.dolarapi.com/v1/dolares/oficial`).
No es obligatoria — si la API falla o tarda más de 5 s, el sistema aplica una
tasa por defecto y el endpoint sigue funcionando.

---

## Instalación y ejecución

### 1. Clonar e instalar dependencias

```bash
git clone <url-del-repositorio>
cd bookstore-inventory-api
npm install
```

> `npm install` ejecuta `prisma generate` en el `postinstall`, que genera el
> cliente de Prisma en `src/generated/prisma` (carpeta ignorada por git).

### 2. Configurar las variables de entorno

Copia el ejemplo y ajústalo si hace falta:

```bash
cp .env.example .env          # bash / git-bash / macOS / Linux
Copy-Item .env.example .env   # PowerShell
```

| Variable               | Valor por defecto  | Para qué sirve                              |
| ---------------------- | ------------------ | ------------------------------------------- |
| `PORT`                 | `3000`             | Puerto donde escucha la API                 |
| `EXCHANGE_RATE_SOURCE` | `dolarapi`         | Fuente de la tasa de cambio (ver más abajo) |
| `POSTGRES_USER`        | `admin`            | Usuario del contenedor de Postgres          |
| `POSTGRES_PASSWORD`    | `admin`            | Contraseña del contenedor de Postgres       |
| `POSTGRES_DB`          | `bookstore`        | Nombre de la base de datos                  |
| `POSTGRES_PORT`        | `5432`             | Puerto del **host** mapeado al contenedor   |
| `DATABASE_URL`         | ver `.env.example` | Cadena de conexión que usan Prisma y la API |

> ⚠️ Si cambias cualquier `POSTGRES_*`, actualiza también `DATABASE_URL` a mano:
> son dos valores independientes y Prisma solo lee `DATABASE_URL`.

Los valores por defecto ya son coherentes entre sí, así que basta con copiar el
archivo para empezar.

### Opción A — Todo con Docker (la más rápida)

Levanta PostgreSQL y la API en un solo comando. El contenedor de la API aplica
las migraciones pendientes (`prisma migrate deploy`) antes de arrancar:

```bash
docker compose up -d --build
```

La API queda disponible en `http://localhost:3000`. Para ver los logs o parar:

```bash
docker compose logs -f api
docker compose down            # añade -v para borrar también los datos
```

### Opción B — Postgres en Docker, API en local (recomendada para desarrollar)

```bash
# 1. Solo la base de datos
docker compose up -d postgres

# 2. Crear el esquema (primera vez o tras cambiar prisma/schema.prisma)
npm run prisma:migrate

# 3. Arrancar en modo watch
npm run start:dev
```

En la opción B, `DATABASE_URL` debe apuntar a `localhost` (como en
`.env.example`); en la opción A, Docker Compose inyecta automáticamente la
variable apuntando al host interno `postgres:5432`.

### 3. Verificar que funciona

```bash
curl http://localhost:3000/books
# {"books":[],"total":0,"page":1,"limit":10}
```

> No existe una ruta raíz: `GET /` responde `404`. Empieza por `/books`.

Para trabajar con datos desde el primer momento, carga el catálogo de
demostración (50 libros, idempotente):

```bash
curl -X POST http://localhost:3000/books/seed
# {"requested":50,"created":50,"skipped":0}
```

### Producción sin Docker

```bash
npm run build
npm run prisma:deploy    # aplica migraciones sin generar nuevas
npm run start:prod
```

---

## Scripts disponibles

| Comando                   | Qué hace                                   |
| ------------------------- | ------------------------------------------ |
| `npm run start:dev`       | Servidor en modo watch (`PORT` o 3000)     |
| `npm run start:prod`      | Ejecuta el build de `dist/main.js`         |
| `npm run build`           | Compila a `dist/`                          |
| `npm test`                | Tests unitarios (Jest)                     |
| `npm run test:cov`        | Tests con reporte de cobertura             |
| `npm run test:e2e`        | Tests end-to-end                           |
| `npm run lint`            | ESLint con `--fix`                         |
| `npm run format`          | Prettier sobre `src/` y `test/`            |
| `npm run prisma:migrate`  | Crea y aplica una migración (desarrollo)   |
| `npm run prisma:deploy`   | Aplica migraciones pendientes (producción) |
| `npm run prisma:generate` | Regenera el cliente de Prisma              |
| `npm run prisma:studio`   | Abre Prisma Studio para explorar los datos |

Los tests unitarios (`npm test`) no necesitan base de datos: usan el doble en
memoria `BookMockRepo` y providers fijos de fecha y tasa de cambio.

---

## Modelo de datos

El API expone **camelCase** (el documento de requisitos usa `snake_case`):

```json
{
  "id": 1,
  "title": "The Pragmatic Programmer",
  "author": "David Thomas",
  "isbn": "978-0135957059",
  "costUsd": 34.99,
  "sellingPriceLocal": null,
  "stockQuantity": 12,
  "category": "Software Engineering",
  "supplierCountry": "US",
  "createdAt": "2026-08-01T12:00:00.000Z",
  "updatedAt": "2026-08-01T12:00:00.000Z"
}
```

`sellingPriceLocal` nace como `null` y se rellena al llamar a
`POST /books/{id}/calculate-price`.

## Formato de las respuestas

- **Éxito**: se devuelve el valor del caso de uso **sin envoltorio**
  (`201` en los `POST`, `200` en el resto).
- **Error**: siempre `{ code, message, additionalInfo? }`.

| `code`           | HTTP  | Cuándo aparece                                     |
| ---------------- | ----- | -------------------------------------------------- |
| `BOOK-E-001`     | `400` | Ya existe un libro con ese ISBN                    |
| `BOOK-E-002`     | `404` | No existe un libro con ese id                      |
| `BAD_REQUEST`    | `400` | Falla la validación del body o de los query params |
| `NOT_FOUND`      | `404` | Ruta inexistente                                   |
| `INTERNAL_ERROR` | `500` | Error inesperado (el detalle solo va al log)       |

---

## Ejemplos de uso de los endpoints

| Método   | Endpoint                      | Descripción              |
| -------- | ----------------------------- | ------------------------ |
| `POST`   | `/books`                      | Crear libro              |
| `POST`   | `/books/seed`                 | Cargar 50 libros de demo |
| `GET`    | `/books`                      | Listar libros (paginado) |
| `GET`    | `/books/search?category=`     | Buscar por categoría     |
| `GET`    | `/books/low-stock?threshold=` | Libros con stock bajo    |
| `GET`    | `/books/{id}`                 | Obtener libro por id     |
| `PUT`    | `/books/{id}`                 | Actualizar libro         |
| `DELETE` | `/books/{id}`                 | Eliminar libro           |
| `POST`   | `/books/{id}/calculate-price` | Precio de venta sugerido |

> Los ejemplos usan `curl` con comillas simples (bash, git-bash, WSL, macOS,
> Linux). En **PowerShell** las comillas simples no escapan igual: importa la
> [colección de Postman](postman/bookstore-inventory-api.postman_collection.json)
> — ya trae ejemplos de respuesta para cada caso — o usa `Invoke-RestMethod`.

### Crear un libro

```bash
curl -X POST http://localhost:3000/books \
  -H 'Content-Type: application/json' \
  -d '{
    "title": "The Pragmatic Programmer",
    "author": "David Thomas",
    "isbn": "978-0135957059",
    "costUsd": 34.99,
    "stockQuantity": 12,
    "category": "Software Engineering",
    "supplierCountry": "US"
  }'
```

`201 Created` — devuelve solo el id generado:

```json
{ "id": 1 }
```

`400 Bad Request` si el ISBN ya existe:

```json
{
  "code": "BOOK-E-001",
  "message": "A book with that ISBN code already exists"
}
```

`400 Bad Request` si el body no valida:

```json
{
  "code": "BAD_REQUEST",
  "message": "title must be a string, costUsd must not be less than 0"
}
```

### Cargar el catálogo de demostración

Endpoint público, sin body ni parámetros: inserta 50 libros con variedad de
categorías, países de origen y niveles de stock (varios por debajo de 10, para
probar `/books/low-stock`). Todos nacen con `sellingPriceLocal` en `null`.

```bash
curl -X POST http://localhost:3000/books/seed
```

`201 Created`:

```json
{ "requested": 50, "created": 50, "skipped": 0 }
```

Es idempotente: los libros cuyo ISBN ya está cargado se omiten en lugar de
fallar, así que una segunda llamada no duplica nada.

```json
{ "requested": 50, "created": 0, "skipped": 50 }
```

### Listar libros (paginado)

`page` y `limit` son opcionales; por defecto `page=1` y `limit=10`.

```bash
curl 'http://localhost:3000/books?page=1&limit=10'
```

`200 OK` — la metadata de paginación viaja dentro del propio cuerpo:

```json
{
  "books": [
    {
      "id": 1,
      "title": "The Pragmatic Programmer",
      "author": "David Thomas",
      "isbn": "978-0135957059",
      "costUsd": 34.99,
      "sellingPriceLocal": null,
      "stockQuantity": 12,
      "category": "Software Engineering",
      "supplierCountry": "US",
      "createdAt": "2026-08-01T12:00:00.000Z",
      "updatedAt": "2026-08-01T12:00:00.000Z"
    }
  ],
  "total": 1,
  "page": 1,
  "limit": 10
}
```

### Obtener un libro por id

```bash
curl http://localhost:3000/books/1
```

`200 OK` devuelve el libro completo. Si no existe, `404`:

```json
{ "code": "BOOK-E-002", "message": "The book does not exist" }
```

### Buscar por categoría

```bash
curl 'http://localhost:3000/books/search?category=Software%20Engineering'
```

`200 OK` — array de libros (vacío si no hay coincidencias). `category` es
obligatorio: sin él la respuesta es `400 BAD_REQUEST`.

### Libros con stock bajo

Devuelve los libros cuyo `stockQuantity` es menor o igual al umbral.
`threshold` es opcional y por defecto vale `10`.

```bash
curl 'http://localhost:3000/books/low-stock?threshold=5'
```

`200 OK` — array de libros.

### Actualizar un libro

`PUT` reemplaza el recurso: todos los campos del body son obligatorios.

```bash
curl -X PUT http://localhost:3000/books/1 \
  -H 'Content-Type: application/json' \
  -d '{
    "title": "The Pragmatic Programmer",
    "author": "David Thomas",
    "isbn": "978-0135957059",
    "costUsd": 29.99,
    "stockQuantity": 20,
    "category": "Software Engineering",
    "supplierCountry": "US"
  }'
```

`200 OK` — devuelve el libro actualizado, con `updatedAt` refrescado.
Errores posibles: `404 BOOK-E-002` (no existe) y `400 BOOK-E-001` (el ISBN ya
pertenece a otro libro).

### Eliminar un libro

```bash
curl -X DELETE http://localhost:3000/books/1
```

`200 OK`:

```json
{ "id": 1 }
```

`404 BOOK-E-002` si el libro no existe.

### Calcular el precio de venta sugerido

Toma el `costUsd` del libro, obtiene la tasa USD → **VES** (moneda local de la
cadena), aplica un margen del **40 %**, guarda el resultado en
`sellingPriceLocal` y devuelve el cálculo detallado.

```bash
curl -X POST http://localhost:3000/books/1/calculate-price
```

`201 Created`:

```json
{
  "bookId": 1,
  "costUsd": 34.99,
  "exchangeRate": 208.42,
  "costLocal": 7292.62,
  "marginPercentage": 40,
  "sellingPriceLocal": 10209.67,
  "currency": "VES",
  "calculationTimestamp": "2026-08-01T12:00:00.000Z"
}
```

Cómo se obtiene la tasa:

1. Se consulta la API configurada en `EXCHANGE_RATE_SOURCE` con un timeout de
   5 s.
2. Si la API no responde, devuelve un error o no trae la moneda, se registra un
   `WARN` y se usa una **tasa por defecto**, de modo que el cálculo nunca se
   interrumpe.

Hay dos adaptadores del mismo puerto `ExchangeRateProvider`:

| `EXCHANGE_RATE_SOURCE`   | Adaptador                 | Fuente                                           |
| ------------------------ | ------------------------- | ------------------------------------------------ |
| `dolarapi` (por defecto) | `DolarApiProvider`        | `https://ve.dolarapi.com/v1/dolares/oficial`     |
| `exchangerate-api`       | `ExchangeRateApiProvider` | `https://api.exchangerate-api.com/v4/latest/USD` |

`DolarApiProvider` publica el **dólar oficial** (BCV) y toma el valor de
`promedio` (o de `venta` si `promedio` viniera vacío); al ser una cotización
USD → VES única, solo responde para `VES`.

```bash
curl https://ve.dolarapi.com/v1/dolares/oficial
```

```json
{
  "moneda": "USD",
  "fuente": "oficial",
  "nombre": "Dólar",
  "compra": null,
  "venta": null,
  "promedio": 746.6297,
  "fechaActualizacion": "2026-07-31T00:00:00-04:00"
}
```

> El plan gratuito de `exchangerate-api.com` no publica `VES`, así que con
> `EXCHANGE_RATE_SOURCE=exchangerate-api` lo normal es ver la tasa de reserva y
> este aviso en los logs:
> `WARN [ExchangeRateApiProvider] Using the fallback rate for VES`. El endpoint
> responde `201` igualmente. Por eso el valor por defecto es `dolarapi`.

`404 BOOK-E-002` si el libro no existe.

---

## Estado actual

Implementados los ocho endpoints del documento de requisitos, con persistencia
en PostgreSQL vía Prisma, mapeo de errores de dominio a HTTP y logging de cada
petición. Los 44 tests unitarios pasan (`npm test`).

Pendientes conocidos:

- Validación del **formato** del ISBN (10 o 13 dígitos): hoy solo se valida que
  sea un string y que no esté duplicado.
- `costUsd` usa `@Min(0)`, así que acepta `0`; la regla de negocio pide `> 0`.
- `test/app.e2e-spec.ts` sigue siendo el placeholder de NestJS (espera
  `GET /` → "Hello World!", ruta que no existe), por lo que `npm run test:e2e`
  falla.
