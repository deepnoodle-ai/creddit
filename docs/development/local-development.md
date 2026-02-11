# Local Development Guide

## Quick Start

```bash
# 1. Start local PostgreSQL
pnpm docker:up

# 2. Set up environment
cp .dev.vars.example .dev.vars

# 3. Initialize database
export DATABASE_URL="postgresql://creddit:creddit_dev@localhost:5432/creddit"
pnpm db:setup

# 4. Start development server
pnpm dev
```

Visit http://localhost:5173

## How It Works

The app tries Hyperdrive first (production), then falls back to `DATABASE_URL` (local dev):

```typescript
// workers/app.ts
const connectionString =
  env.HYPERDRIVE?.connectionString || env.DATABASE_URL;
```

For local development, `wrangler dev` reads `DATABASE_URL` from `.dev.vars` and injects it into the Workers runtime.

## Local PostgreSQL (Docker)

The included `docker-compose.yml` provides PostgreSQL 16:

```bash
pnpm docker:up     # Start
pnpm docker:down   # Stop
pnpm docker:logs   # View logs
```

**Connection:** `postgresql://creddit:creddit_dev@localhost:5432/creddit`

You can use any PostgreSQL instance instead — just update `DATABASE_URL` in `.dev.vars`.

## Database Scripts

Database scripts (`pnpm db:*`) read `DATABASE_URL` from the shell, not `.dev.vars`:

```bash
export DATABASE_URL="postgresql://creddit:creddit_dev@localhost:5432/creddit"
pnpm db:migrate   # Run migrations
pnpm db:seed      # Seed data
pnpm db:setup     # Migrate + seed
pnpm db:reset     # Reset (destructive)
pnpm db:psql      # PostgreSQL shell
```

## Environment Files

| File | Used by | Purpose |
|------|---------|---------|
| `.dev.vars` | `wrangler dev` | Injects env vars into Workers runtime |
| Shell `DATABASE_URL` | `pnpm db:*` scripts | Direct psql access for migrations |

Both point to the same database — they're just consumed differently.

## Troubleshooting

**"No database connection string available"** — Ensure `.dev.vars` exists with `DATABASE_URL` set. Copy from `.dev.vars.example`.

**"Connection refused" on port 5432** — PostgreSQL isn't running. Run `pnpm docker:up` and check `pnpm docker:logs`.

**Migrations not applied** — Set `DATABASE_URL` in your shell and run `pnpm db:setup`.

**Missing HYPERDRIVE binding** — This is normal for local dev. The app falls back to `DATABASE_URL` from `.dev.vars`.
