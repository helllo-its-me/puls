# Puls

Puls is a mobile health and wellness application built as a typed full-stack monorepo.

The project combines a React Native mobile client with a TypeScript backend and shared contracts between layers. It is designed around clean architectural boundaries, strict typing, reusable UI primitives, and a scalable data flow from database to API to mobile presentation.

## Tech Stack

| Layer | Technology |
|---|---|
| Mobile | Expo SDK 54, React Native, React 19, Expo Router |
| Backend | Hono, `@hono/node-server`, TypeScript |
| Database | PostgreSQL, Drizzle ORM |
| Shared Contracts | TypeScript, Zod |
| Data Fetching | TanStack Query |
| Forms & Validation | React Hook Form, Zod |
| Internationalization | custom i18n layer, `Intl` |
| Testing | Vitest, Playwright |
| Tooling | pnpm workspace, Docker Compose |

## Prerequisites

- Node.js version declared in `.nvmrc`
- pnpm 10.6.5 through Corepack
- Docker for database and E2E checks

Use `.nvmrc` to select the repository Node.js version, then install dependencies:

```bash
corepack enable
pnpm install --frozen-lockfile
pnpm exec playwright install chromium
```

## Quality checks

Run the same checks that protect pull requests in CI:

```bash
pnpm typecheck
pnpm lint
pnpm test:unit
pnpm test:e2e
pnpm build
```

## Architecture

The repository is organized as a monorepo with clear separation of responsibilities:

- `apps/mobile`  
  Expo / React Native application

- `apps/api`  
  Backend API

- `packages/shared`  
  Shared schemas, types, and cross-layer constants

- `packages/db`  
  Database schema, client, and development seed/bootstrap logic

The system follows explicit layer boundaries:

- **DB layer** stores persistent domain data
- **API layer** reads from the database and exposes typed responses
- **UI layer** transforms API data into screen-specific view models
- **Presentation components** remain intentionally dumb and receive prepared data only

This keeps persistence, transport, and rendering concerns isolated from each other.

## Database migrations

Database schema changes are stored as versioned SQL migrations in `packages/db/migrations`.

After changing `packages/db/src/schema.ts`, generate and review a migration:

```bash
pnpm db:generate
```

Apply all pending migrations to the configured database:

```bash
pnpm db:migrate
```

Validate both the migration history and that `schema.ts` matches the latest migration:

```bash
pnpm db:check
```

`pnpm dev:full` applies pending migrations automatically before starting the API and mobile app.

For databases previously created with `db:push`, `db:migrate` first introspects the existing schema and compares it with the initial migration snapshot. An exact match is safely recorded as the initial baseline without recreating tables or deleting data. Any schema difference stops the migration without recording the baseline.

Run the isolated migration workflow tests:

```bash
pnpm test:migrations
```

The tests create temporary databases for fresh migration, legacy baseline, schema drift, and concurrent startup scenarios. They do not use or seed the regular `health_app` database.

Playwright also creates a uniquely named `puls_e2e_<pid>` database, runs migrations and seed only there, and removes it during global teardown. `pnpm test:e2e` never truncates the regular development database.

## Authentication security configuration

- `NODE_ENV` is required and must be `development`, `test`, `staging`, or `production`. Only `development` and `test` permit local relaxed security settings.
- `AUTH_TOKEN_SECRET` and every value in `AUTH_TOKEN_PREVIOUS_SECRETS` must be generated secrets. Staging and production accept only an exact 32-byte value encoded as 64 hex or 43 base64url characters.
- `WEB_APP_ORIGINS` contains the comma-separated web origins allowed to use credentialed API requests. Staging and production require a non-empty HTTPS allowlist and Secure cookies. Web refresh tokens are held only in an `HttpOnly; SameSite=Strict` cookie; native refresh tokens remain in SecureStore.
- `AUTH_TRUST_PROXY_HOPS` must match the number of trusted reverse proxies in front of the API. Leave it at `0` when the API is directly reachable.
- `PASSWORD_RESET_EMAIL_DELIVERY_MODE=log` is allowed only in development/test. Staging and production must explicitly use `smtp`; port 465 uses implicit TLS, while other ports require a successful STARTTLS upgrade.
- Password reset emails are delivered asynchronously from a durable queue. Pending reset codes are encrypted with a key derived from `AUTH_TOKEN_SECRET`; keep rotated values in `AUTH_TOKEN_PREVIOUS_SECRETS` until their queued jobs expire.
- Registration always returns the same accepted response without creating a session. Pending credentials, the emailed code, and a client-held registration token belong to one immutable attempt; only that exact attempt can create the account. `REGISTRATION_MIN_RESPONSE_MS` sets the minimum request duration so an existing email cannot be inferred from status, body, or ordinary timing differences; staging and production reject values below 1000 ms.
- `PASSWORD_RESET_MIN_RESPONSE_MS` provides the minimum password-reset request duration and should be tuned above normal password-hashing and database latency; staging and production reject values below 1000 ms.
- Auth and password reset responses use `Cache-Control: no-store`.
- The development password reset sender writes codes to the local log and is never selected in production.

## Project Structure

```text
Puls/
├── apps/
│   ├── api/
│   └── mobile/
├── packages/
│   ├── db/
│   └── shared/
├── scripts/
├── tests/
└── docker-compose.yml
