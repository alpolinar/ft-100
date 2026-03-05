# ft-100 Project Agent Guide

## Project Overview

**ft-100** is a real-time multiplayer counting game built as a **pnpm monorepo** using **Turborepo** for orchestration.

## Environment

| Tool       | Version | Managed by    |
|------------|---------|---------------|
| Node.js    | 24      | mise.toml     |
| pnpm       | 10      | mise.toml     |
| TypeScript | 5.9.2   | root devDeps  |

## Package Manager

- **pnpm@10.0.0** — always use `pnpm`, never `npm` or `yarn`
- Workspace defined in `pnpm-workspace.yaml`: `apps/*`, `packages/*`
- Common commands:
  - `pnpm install` — install all dependencies
  - `pnpm dev` — start all apps via Turborepo
  - `pnpm build` — build all apps
  - `pnpm lint` / `pnpm format` — lint and format via Turborepo

## Monorepo Structure

```
ft-100/
├── apps/
│   ├── server/          # Backend API
│   └── web/             # Frontend
├── packages/
│   ├── typescript-config/ # Shared tsconfig bases
│   └── ui/              # Shared UI components
└── services/
    └── docker-compose.yml # Redis + Postgres
```

## Apps

### `apps/server` — Backend API
- **Runtime**: Fastify 5 + tRPC 11 (HTTP + WebSocket subscriptions)
- **Language**: TypeScript (ESM, `"type": "module"`)
- **ORM**: Prisma 7 with PostgreSQL (`prisma/schema.prisma`)
- **Cache/State**: Redis via ioredis (game state stored in Redis, finished games persisted to Postgres)
- **Logging**: Pino (with pino-pretty in dev)
- **Env validation**: Zod schema in `src/env.ts`
- **Dev command**: `pnpm --filter server dev` (uses tsx watch)
- **Build**: `pnpm --filter server build` (tsc)
- **Port**: 3001 (default via `APP_PORT`)

#### Server Environment Variables
| Variable             | Description                   |
|----------------------|-------------------------------|
| `NODE_ENV`           | test / development / staging / production |
| `APP_PORT`           | Server port (default: 3001)   |
| `CLIENT_ORIGIN`     | Allowed CORS origin URL       |
| `SECRET`            | Session/auth secret           |
| `REDIS_SERVICE_HOST` | Redis hostname                |
| `REDIS_SERVICE_PORT` | Redis port (default: 6379)    |
| `REDIS_PASSWORD`    | Redis password (optional)     |
| `GAME_TTL_SECONDS`  | Game TTL in Redis (default: 86400) |
| `DATABASE_URL`      | PostgreSQL connection string  |

### `apps/web` — Frontend
- **Framework**: Next.js 16 (App Router) + React 19
- **Data**: tRPC client + TanStack React Query
- **Forms**: TanStack React Form
- **Dev command**: `pnpm --filter web dev` (port 3000)

## Infrastructure (Docker Compose)

Located at `services/docker-compose.yml`:
- **Redis 7** — port 6379, persistent (AOF)
- **RedisInsight** — port 5540 (GUI for Redis)
- **PostgreSQL 18** — port 5432, user: `ft100user`, db: `ft100db`

Start with: `docker compose -f services/docker-compose.yml up -d`

## Code Quality

- **Linter/Formatter**: Biome v2 (`biome.json` at root)
  - Indent: 2 spaces
  - Quotes: double
  - Trailing commas: ES5
  - Import organization: enabled
- **TypeScript**: Strict, uses shared base config from `@repo/typescript-config`

## Key Conventions

- All TypeScript files use **ESM** (`"type": "module"`) — imports must use `.js` extensions
- Domain entities live in `apps/server/src/domain/entities/`
- Infrastructure (Redis stores, logging) lives in `apps/server/src/infrastructure/`
- tRPC routes live in `apps/server/src/trpc/routes/`
- Prisma schema at `apps/server/prisma/schema.prisma`, generated client at `prisma/generated/prisma`
