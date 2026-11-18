# E-Commerce Order & Delivery Management Backend

A strict-TypeScript (Node + Express) backend for orders, carts, payments, delivery, discounts, and admin operations. SQLite is used through `better-sqlite3`, always behind repository classes. Domain classes contain no Express, JWT, or database code.

> This backend lives in `backend/` so the existing Next.js storefront in the repository root is not modified.

## Quick start

```bash
cd backend
npm install
cp .env.example .env          # optional; defaults work out of the box
npm run seed -- --reset       # creates sample data
npm run dev                   # http://localhost:4000
```

Production-style run:

```bash
npm run build
npm start
```

Verification:

```bash
npm run typecheck
npm test
curl http://localhost:4000/health
```

The server also seeds automatically on startup if the sample rows are missing.

### Environment

| Variable | Default | Purpose |
| --- | --- | --- |
| `PORT` | `4000` | HTTP port |
| `JWT_SECRET` | dev-only secret | Change in production |
| `DB_PATH` | `./data/ecommerce.sqlite` | SQLite file (use `:memory:` for tests) |
| `CORS_ORIGIN` | `*` | Allowed CORS origin |
| `NODE_ENV` | `development` | Runtime label |

### Seeded accounts

| Role | Email | Password |
| --- | --- | --- |
| Admin | `admin@example.com` | `Admin123!` |
| Regular customer | `regular@example.com` | `Customer123!` |
| Premium customer | `premium@example.com` | `Customer123!` |
| Business customer | `business@example.com` | `Customer123!` |

Seeded products include physical products, a digital download, and a subscription. Seeded discounts: `SAVE10`, `TAKE20`, `BOGO`, `SUMMER15`.

## Design

```text
src/
  domain/         Pure OOP model, pricing pipeline, strategies, state machine
  services/       Use cases / transaction boundaries
  repositories/   SQLite persistence behind classes (domain never sees SQL)
  controllers/    HTTP adapters and API-boundary type factories
  routes/         Express routing and zod validation schemas
  middleware/     JWT auth, role checks, validation, logging, error handler
docs/
  RELATIONSHIPS.md
```

Key rules enforced in code:

- `Order.status`, `Order.totalAmount`, `Order.items`, `Customer.balance`, and `Product.stock` are private and change only through named methods.
- Invalid lifecycle transitions throw `DomainError` with code `INVALID_TRANSITION`.
- Stock is reserved on `confirm`, restored on `cancel`/`refund`, and can never go negative.
- A payment cannot be refunded twice (`ORDER_ALREADY_REFUNDED` / `PAYMENT_ALREADY_REFUNDED`).
- Promo and customer discounts are clamped so the final total never goes below `0`.
- Every cart/order item, delivery, or promo change recomputes the full breakdown.
- No `switch(type)` or `if (type === ...)` in business logic. Type strings become objects only in `src/controllers/factories.ts` and in the persistence mapper `src/repositories/mappers.ts`.

See [docs/RELATIONSHIPS.md](./docs/RELATIONSHIPS.md) for composition/association/aggregation details.

### Pricing pipeline

`PricingCalculator` composes four small collaborators:

```text
Subtotal + Shipping + Tax - CustomerDiscount - PromoDiscount + AdditionalCharges
```

Customer tiers, delivery methods, products, and discounts use inheritance/polymorphism, so adding a new variant does not require editing `Order` or `PricingCalculator`.

## API

All errors use `{ "error": "message", "code": "ERROR_CODE" }` (with optional `details`).

### Public

| Method | Path | Description |
| --- | --- | --- |
| GET | `/health` | Health check |
| POST | `/auth/register` | Register a customer |
| POST | `/auth/login` | Login, returns JWT |
| GET | `/products` | List/filter products (`?category=`, `?search=`) |
| GET | `/products/:id` | Product detail |
| GET | `/delivery-methods` | Cost and ETA for each delivery method |

### Customer (Bearer token, `role: customer`)

| Method | Path | Description |
| --- | --- | --- |
| GET | `/auth/me` | Current user |
| GET | `/cart` | Cart with live totals |
| POST | `/cart/items` | Add item |
| PATCH | `/cart/items/:productId` | Change quantity |
| DELETE | `/cart/items/:productId` | Remove item |
| POST | `/cart/promo` | Apply promo code |
| POST | `/cart/delivery` | Change delivery method (`standard`, `express`, `same_day`) |
| POST | `/orders` | Checkout cart into an order |
| GET | `/orders` | My orders |
| GET | `/orders/:id` | Order with full breakdown |
| PATCH | `/orders/:id/items` | Update an order item (CREATED only) |
| POST | `/orders/:id/confirm` | Confirm and reserve stock |
| POST | `/orders/:id/pay` | Pay (`credit_card`, `bank_transfer`, `digital_wallet`) |
| POST | `/orders/:id/cancel` | Cancel and restore stock |
| GET | `/orders/:id/invoice` | Invoice document |
| POST | `/wallet/top-up` | Add wallet funds |

### Admin (Bearer token, `role: admin`)

| Method | Path | Description |
| --- | --- | --- |
| GET/POST | `/admin/products` | List / create products |
| GET/PATCH/DELETE | `/admin/products/:id` | Product CRUD |
| PATCH | `/admin/products/:id/stock` | Set physical stock |
| GET/POST | `/admin/discounts` | List / create discounts |
| GET/PATCH/DELETE | `/admin/discounts/:id` | Discount CRUD |
| GET | `/admin/orders` | All orders |
| GET | `/admin/customers` | All customers |
| GET | `/admin/stats` | Revenue, status counts, low stock |
| PATCH | `/admin/orders/:id/process` | PAID → PROCESSING |
| PATCH | `/admin/orders/:id/ship` | PROCESSING → SHIPPED |
| PATCH | `/admin/orders/:id/deliver` | SHIPPED → DELIVERED |
| POST | `/admin/orders/:id/refund` | Refund once |

## curl examples

The examples below use Bash quoting. On Windows PowerShell, put each JSON body in a file and use `curl.exe --data-binary @body.json` to avoid quote-stripping.

### Login

```bash
ADMIN_TOKEN=$(curl -s -X POST http://localhost:4000/auth/login \
  -H 'Content-Type: application/json' \
  -d '{"email":"admin@example.com","password":"Admin123!"}' | jq -r .token)

CUSTOMER_TOKEN=$(curl -s -X POST http://localhost:4000/auth/login \
  -H 'Content-Type: application/json' \
  -d '{"email":"regular@example.com","password":"Customer123!"}' | jq -r .token)
```

### Public catalog

```bash
curl http://localhost:4000/products
curl 'http://localhost:4000/products?category=apparel&search=dress'
curl http://localhost:4000/products/seed-product-dress
curl http://localhost:4000/delivery-methods
```

### Cart live recalculation

```bash
curl -X POST http://localhost:4000/cart/items \
  -H "Authorization: Bearer $CUSTOMER_TOKEN" -H 'Content-Type: application/json' \
  -d '{"productId":"seed-product-dress","quantity":2}'

curl -X PATCH http://localhost:4000/cart/items/seed-product-dress \
  -H "Authorization: Bearer $CUSTOMER_TOKEN" -H 'Content-Type: application/json' \
  -d '{"quantity":3}'

curl -X POST http://localhost:4000/cart/promo \
  -H "Authorization: Bearer $CUSTOMER_TOKEN" -H 'Content-Type: application/json' \
  -d '{"code":"SAVE10"}'

curl -X POST http://localhost:4000/cart/delivery \
  -H "Authorization: Bearer $CUSTOMER_TOKEN" -H 'Content-Type: application/json' \
  -d '{"code":"express"}'
```

Every response contains `cart.breakdown` with the recalculated total.

### Order lifecycle

```bash
curl -X POST http://localhost:4000/orders \
  -H "Authorization: Bearer $CUSTOMER_TOKEN" -H 'Content-Type: application/json' \
  -d '{"deliveryMethod":"standard"}'

curl -X POST http://localhost:4000/orders/ORDER_ID/confirm \
  -H "Authorization: Bearer $CUSTOMER_TOKEN"

curl -X POST http://localhost:4000/orders/ORDER_ID/pay \
  -H "Authorization: Bearer $CUSTOMER_TOKEN" -H 'Content-Type: application/json' \
  -d '{"method":"credit_card","last4":"4242"}'

curl -X PATCH http://localhost:4000/admin/orders/ORDER_ID/process \
  -H "Authorization: Bearer $ADMIN_TOKEN"

curl -X PATCH http://localhost:4000/admin/orders/ORDER_ID/ship \
  -H "Authorization: Bearer $ADMIN_TOKEN" -H 'Content-Type: application/json' \
  -d '{"trackingNumber":"TRK-123"}'

curl -X PATCH http://localhost:4000/admin/orders/ORDER_ID/deliver \
  -H "Authorization: Bearer $ADMIN_TOKEN"

curl -X POST http://localhost:4000/admin/orders/ORDER_ID/refund \
  -H "Authorization: Bearer $ADMIN_TOKEN"
```

### Wallet payment

```bash
curl -X POST http://localhost:4000/wallet/top-up \
  -H "Authorization: Bearer $CUSTOMER_TOKEN" -H 'Content-Type: application/json' \
  -d '{"amount":100}'

curl -X POST http://localhost:4000/orders/ORDER_ID/pay \
  -H "Authorization: Bearer $CUSTOMER_TOKEN" -H 'Content-Type: application/json' \
  -d '{"method":"digital_wallet","provider":"my-wallet"}'
```

### Admin product creation

```bash
curl -X POST http://localhost:4000/admin/products \
  -H "Authorization: Bearer $ADMIN_TOKEN" -H 'Content-Type: application/json' \
  -d '{
    "type":"physical",
    "name":"New Dress",
    "description":"Limited edition",
    "category":"apparel",
    "sku":"DRS-9001",
    "price":89.99,
    "stock":10,
    "weight":0.5,
    "dimensions":{"length":30,"width":20,"height":3,"unit":"cm"}
  }'

curl -X PATCH http://localhost:4000/admin/products/PRODUCT_ID/stock \
  -H "Authorization: Bearer $ADMIN_TOKEN" -H 'Content-Type: application/json' \
  -d '{"stock":4}'

curl http://localhost:4000/admin/stats -H "Authorization: Bearer $ADMIN_TOKEN"
```

## Tests

`npm test` runs 30 Jest tests across seven suites:

- Lifecycle transitions and empty-order confirmation.
- Stock reservation/restoration and negative-stock prevention.
- Double refund, wallet refund, and automatic refund on cancellation.
- Customer tier and discount polymorphism, including clamping.
- Composite pricing and live recalculation.
- Domain relationships and full REST API integration with Supertest.
