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
