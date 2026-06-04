# DDD E-Commerce API

A NestJS e-commerce backend built as an [Nx](https://nx.dev) monorepo using **Domain-Driven Design (DDD)**, **CQRS**, and an **event-driven** checkout/payment flow.

The single deployable app is `api-gateway`. Business capabilities live in bounded-context libraries under `libs/`.

---

## Requirements

| Tool | Version | Notes |
|------|---------|-------|
| **Node.js** | 22.x | Used in the production Docker image |
| **pnpm** | 9+ | Package manager (`corepack enable` recommended) |
| **PostgreSQL** | 18 | Primary datastore |
| **Redis** | 7 | Sessions, refresh tokens, order idempotency |
| **Docker & Docker Compose** | optional | Full stack deployment |

---

## Architecture

### Monorepo layout

```
apps/
  api-gateway/          # NestJS entrypoint — wires all bounded contexts
libs/
  customers/            # Registration, login, JWT sessions
  products/             # Product catalog (CRUD)
  orders/               # Cart/order lifecycle
  payment/              # Wallet, payments, external provider adapters
  shared/               # Drizzle, Redis, JWT, i18n, health, cross-cutting utilities
```

Each bounded context follows the same layering:

- **domain** — aggregates, value objects, repository ports
- **application** — commands, queries, use cases, event handlers
- **infrastructure** — Drizzle repositories, auth adapters
- **presentation** — HTTP controllers

### Cross-cutting stack

- **NestJS 11** + **CQRS** (`CommandBus`, `QueryBus`, `EventBus`)
- **PostgreSQL** + **Drizzle ORM** (migrations in `libs/shared`)
- **Redis** (ioredis) for auth sessions and idempotency keys
- **JWT** access/refresh tokens with Redis-backed session state
- **Winston** logging, **nestjs-i18n** (en/fa), **class-validator** DTOs
- Responses wrapped as `{ success: true, data: ... }`

---

## Business logic

### 1. Customer authentication

Customers register and log in with email/password. Passwords are bcrypt-hashed.

On login, the API issues:

- an **access token** (short-lived JWT)
- a **refresh token** (longer-lived JWT)

Both tokens carry a `jti`. Redis stores the canonical session at `session:{jti}`. Refresh rotates the token pair; logout invalidates Redis state.

Protected routes use `CustomerAuthGuard` and read the current customer from `@CurrentUserDec()`.

### 2. Products

Authenticated customers can manage the product catalog:

- create, list, get, edit, delete products
- each product has `name`, `price`, and `stock`

Products are referenced when building orders; the purchase price is snapshotted on the order line item.

### 3. Orders (cart → checkout)

An order moves through these statuses:

| Status | Meaning |
|--------|---------|
| `pending` | Editable — items can be added or removed |
| `processing` | Checkout started; payment in flight |
| `paid` | Payment succeeded |
| `failed` | Payment failed |

Typical flow:

1. **Create order** — `POST /api/orders` with initial line items (Redis idempotency on duplicate requests)
2. **Modify cart** — append or remove items while status is `pending`
3. **Checkout** — `POST /api/orders/:id/checkout` with payment options

Checkout validates the order (non-empty, still `pending`), marks it `processing`, and publishes a **`PaymentInitiatedEvent`**.

### 4. Payments (event-driven)

Payment is handled asynchronously across bounded contexts via domain events:

```
CheckoutOrderHandler          PaymentInitiatedHandler         OrderPaymentSucceededHandler
        │                              │                                  │
        │  PaymentInitiatedEvent       │  charge wallet / provider        │  PaymentSucceededEvent
        └─────────────────────────────►│─────────────────────────────────►│
                                       │                                  │
                                       │  PaymentFailedEvent              │  OrderPaymentFailedHandler
                                       └─────────────────────────────────►│
```

**Payment modes** (`paymentMode` on checkout):

| Mode | Behavior |
|------|----------|
| `wallet_only` | Debit customer wallet balance |
| `provider_only` | Charge via external provider (mock Stripe/PayPal) |
| `hybrid` | Use wallet balance first, charge remainder via provider |

External providers support a configurable fallback chain (`PAYMENT_FALLBACK_CHAIN=stripe,paypal`). Checkout accepts an **idempotency key** so retries do not create duplicate payments.

**Wallet** — `POST /api/wallet/charge` is a mock endpoint to top up balance for testing hybrid/wallet flows.

### 5. Querying payments

- `GET /api/payments/me` — list my payments
- `GET /api/payments/:paymentId` — payment detail
- `GET /api/orders/:orderId/payment` — payment for a specific order

---

## API overview

Base URL: `http://localhost:3000/api`

| Area | Method | Path | Auth |
|------|--------|------|------|
| Health | GET | `/health` | public |
| Customers | POST | `/customers/register` | public |
| Customers | POST | `/customers/login` | public |
| Customers | POST | `/customers/refresh` | public |
| Customers | GET/PATCH | `/customers/me` | bearer |
| Customers | POST | `/customers/logout`, `/logout-all` | bearer |
| Products | GET/POST | `/products`, `/products/:id` | bearer |
| Products | PATCH/DELETE | `/products/:id` | bearer |
| Orders | POST/GET | `/orders`, `/orders/:id` | bearer |
| Orders | POST/DELETE | `/orders/:id/items`, `/orders/:id/items/:itemId` | bearer |
| Orders | POST | `/orders/:id/checkout` | bearer |
| Orders | GET | `/orders/:orderId/payment` | bearer |
| Wallet | POST | `/wallet/charge` | bearer |
| Payments | GET | `/payments/me`, `/payments/:paymentId` | bearer |

Optional header: `x-lang: en` or `fa` for localized error messages.

A ready-made **Postman collection** is in [`postman/ddd-ecommerce.postman_collection.json`](postman/ddd-ecommerce.postman_collection.json).

---

## Local development (Nx)

### 1. Install dependencies

```bash
corepack enable
pnpm install
```

### 2. Configure environment

```bash
cp .env.example .env
```

Edit `.env` — at minimum set strong JWT secrets:

```bash
openssl rand -hex 32   # use for JWT_SECRET_ACCESS_TOKEN and JWT_SECRET_REFRESH_TOKEN
```

Ensure PostgreSQL and Redis are running locally (defaults: `localhost:5432`, `localhost:6379`).

### 3. Run database migrations

Apply migrations before first run (or set `DO_MIGRATIONS=true` in `.env` to run them on startup):

```bash
pnpm db:generate   # generate migration from schema changes
pnpm db:migrate    # apply migrations
pnpm db:studio     # Drizzle Studio UI
```

### 4. Start the API

```bash
pnpm exec nx serve @ddd-ecommerce/api-gateway
```

Other useful Nx commands:

```bash
pnpm exec nx build @ddd-ecommerce/api-gateway --configuration=production
pnpm exec nx graph                              # visualize project dependencies
pnpm lint                                       # lint all projects
```

The dev server listens on **http://localhost:3000/api**.

---

## Docker deployment

The repo ships a multi-stage **Dockerfile** and **docker-compose.yml** that run PostgreSQL, Redis, and the API together.

### 1. Prepare Docker environment

```bash
cp .env.docker.example .env.docker
```

Update `.env.docker` before production use:

- set real JWT secrets (`openssl rand -hex 32`)
- review payment provider settings

Docker Compose reads `.env.docker` via `env_file` for the `api-gateway` service. Database and Redis hostnames are already set for the compose network (`postgres`, `redis`).

### 2. Build and start

```bash
docker compose up --build
```

This will:

1. Start **PostgreSQL 18** on port `5432`
2. Start **Redis 7** on port `6379`
3. Build the API image with `pnpm exec nx build @ddd-ecommerce/api-gateway --configuration=production`
4. Start the API on port **3000**

Health check: `GET http://localhost:3000/api/health`

### 3. Stop and clean up

```bash
docker compose down          # stop containers
docker compose down -v       # stop and remove volumes (deletes DB data)
```

### How the Docker build works

```
Stage 1 (builder)                    Stage 2 (production)
─────────────────                    ────────────────────
node:22-alpine                       node:22-alpine
pnpm install --frozen-lockfile       non-root nestjs user
nx build api-gateway (prod)    →     copy node_modules + dist/
pnpm prune --prod                    CMD node dist/main.js
```

On startup, the API connects to `postgres` and `redis` on the compose network and runs Drizzle migrations when `DO_MIGRATIONS=true`.

---

## Environment variables

| Variable | Purpose |
|----------|---------|
| `API_PORT` | HTTP port (default `3000`) |
| `GLOBAL_PREFIX` | Route prefix (default `api`) |
| `MAIN_POSTGRES_URI` | PostgreSQL connection string (runtime) |
| `DATABASE_URL` | Used by Drizzle CLI |
| `DO_MIGRATIONS` | Run migrations on startup (`true` in Docker) |
| `REDIS_HOST`, `REDIS_PORT`, `REDIS_KEY_PREFIX` | Redis connection |
| `JWT_SECRET_ACCESS_TOKEN`, `JWT_SECRET_REFRESH_TOKEN` | Token signing |
| `JWT_EXPIRE_ACCESS_TOKEN_IN`, `JWT_EXPIRE_REFRESH_TOKEN_IN` | Token TTL |
| `PAYMENT_DEFAULT_PROVIDER`, `PAYMENT_FALLBACK_CHAIN` | Mock payment routing |
| `I18N_FALLBACK_LANG` | Default locale |

See [`.env.example`](.env.example) for the full local list and [`.env.docker.example`](.env.docker.example) for container defaults.

---

## Project scripts

| Script | Description |
|--------|-------------|
| `pnpm exec nx serve @ddd-ecommerce/api-gateway` | Dev server |
| `pnpm exec nx build @ddd-ecommerce/api-gateway` | Production build |
| `pnpm db:generate` | Generate Drizzle migration |
| `pnpm db:migrate` | Apply migrations |
| `pnpm db:studio` | Open Drizzle Studio |
| `pnpm lint` | Lint all projects |

---

## License

MIT
