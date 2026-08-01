# Sistema de Gestión de Inventario de Librerías

## Contexto del Negocio

Sistema para una cadena de librerías que permite:

1. Gestionar el inventario de libros.
2. Validar precios contra tasas de cambio actuales (muchos libros se importan).
3. Calcular el precio de venta sugerido.

---

## Modelo de Datos: `Book`

```json
{
  "id": 1,
  "title": "El Quijote",
  "author": "Miguel de Cervantes",
  "isbn": "978-84-376-0494-7",
  "cost_usd": 15.99,
  "selling_price_local": null,
  "stock_quantity": 25,
  "category": "Literatura Clásica",
  "supplier_country": "ES",
  "created_at": "2025-01-15T10:30:00Z",
  "updated_at": "2025-01-15T10:30:00Z"
}
```

---

## Contratos del API

### CRUD Básico

| Método | Endpoint      | Descripción                                       |
| ------ | ------------- | ------------------------------------------------- |
| POST   | `/books`      | Crear libro                                       |
| GET    | `/books`      | Listar todos los libros (con paginación opcional) |
| GET    | `/books/{id}` | Obtener libro por ID                              |
| PUT    | `/books/{id}` | Actualizar libro                                  |
| DELETE | `/books/{id}` | Eliminar libro                                    |

### Endpoints Opcionales

| Método | Endpoint                            | Descripción                  |
| ------ | ----------------------------------- | ---------------------------- |
| GET    | `/books/search?category={category}` | Buscar libros por categoría  |
| GET    | `/books/low-stock?threshold=10`     | Listar libros con stock bajo |

### Integración Externa: Cálculo de Precio

**`POST /books/{id}/calculate-price`** — Calcula el precio de venta sugerido.

Fuente de tasas de cambio (API gratuita): `https://api.exchangerate-api.com/v4/latest/USD`

**Lógica de negocio:**

1. Tomar el `cost_usd` del libro.
2. Obtener la tasa de cambio actual USD → moneda local.
3. Aplicar un margen de ganancia del **40%**.
4. Actualizar `selling_price_local` en la base de datos.
5. Retornar el cálculo detallado.

**Respuesta esperada:**

```json
{
  "book_id": 1,
  "cost_usd": 15.99,
  "exchange_rate": 0.85,
  "cost_local": 13.59,
  "margin_percentage": 40,
  "selling_price_local": 19.03,
  "currency": "EUR",
  "calculation_timestamp": "2025-01-15T10:30:00Z"
}
```

---

## Reglas de Negocio

- `cost_usd` debe ser mayor a 0.
- `stock_quantity` no puede ser negativo.
- `isbn` debe tener formato válido (10 o 13 dígitos).
- No se permiten libros duplicados (mismo ISBN).
- Al calcular el precio, si la API de tasas de cambio falla, usar una tasa por defecto.
- Manejar errores apropiados: `400`, `404`, `500`, `503`.
