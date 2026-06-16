# Sprint 3 — Database Audit (MarketWall)

**Date:** 2026-06-16  
**Scope:** PostgreSQL + Prisma foundation; broker click logging migrated from JSONL.

## Summary

Sprint 3 adds Prisma ORM with a forward-looking schema (User, Watchlist, Alert, Broker) and **replaces file-based broker click storage** with the `BrokerClick` table. Broker catalog pages still read from static JSON (`lib/broker-data.ts`). No UI changes.

## Schema

| Model | Purpose | Wired to app |
|-------|---------|--------------|
| `User` | Auth-ready user record | Schema only (`features.watchlist` disabled) |
| `Watchlist` | Named list per user | Schema only |
| `WatchlistItem` | Symbol rows (`WatchlistSymbol` codes) | Schema only |
| `Alert` | Price/change alerts | Schema only |
| `Broker` | Mirrors `BrokerRecord` in `types/broker.ts` | Schema only (static catalog unchanged) |
| `BrokerClick` | Outbound click analytics | **Active** — `lib/brokers/click-store.ts` |

### BrokerClick fields (matches `BrokerClickLog`)

- `id` (UUID), `slug`, `timestamp`, optional `referer`, `userAgent`, `source`, `campaign`
- Indexes on `slug` and `timestamp`

### Broker model (forward-looking)

JSON columns store bilingual `Bi` fields (`license`, `platforms`, `executionType`, `region`, `accountType`, `offer`, `withdrawalTime`). String arrays for `licenseTags`, `platformTags`, `badges`.

## Migration status

| Item | Status |
|------|--------|
| `prisma/schema.prisma` | Created |
| Migration SQL | Generated: `prisma/migrations/20250616120000_sprint3_init/migration.sql` |
| `migration_lock.toml` | PostgreSQL provider |
| Applied to database | **Pending** — requires a running Postgres instance |

Migration was generated with `prisma migrate diff --from-empty --to-schema`. To apply when Postgres is available:

```bash
# Set DATABASE_URL in .env.local (see .env.example)
npx prisma migrate deploy
# or for dev:
npx prisma migrate dev
```

**Local Postgres (no Docker required on Windows):** install PostgreSQL, create database `marketwall`, set:

```env
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/marketwall
```

**Docker (optional):**

```bash
docker run --name marketwall-pg -e POSTGRES_PASSWORD=postgres -e POSTGRES_DB=marketwall -p 5432:5432 -d postgres:16
```

## Environment variables

| Variable | Required for | Notes |
|----------|--------------|-------|
| `DATABASE_URL` | Prisma migrate + broker click persistence | Added to `.env.example` with placeholder. Added to `.env.local` with local dev URL if missing. **Never commit real credentials.** |

Existing API keys (`TWELVE_DATA_API_KEY`, etc.) unchanged.

## What was replaced

| Before | After |
|--------|-------|
| `data/broker-clicks.jsonl` (append-only JSONL) | `BrokerClick` rows via Prisma |
| `lib/brokers/click-store.ts` fs append | `prisma.brokerClick.create()` |

`data/broker-clicks.jsonl` remains gitignored. Existing file is not migrated automatically.

## API compatibility

| Route | Method | Behavior |
|-------|--------|----------|
| `/api/brokers/redirect?slug=…` | GET | Unchanged — logs click, 302 redirect |
| `/api/brokers/clicks` | POST | Unchanged — `{ ok: true, id }` on success |

Request/response shapes unchanged. If the database is unreachable, `logBrokerClick` falls back to a synthetic in-memory event (same as prior read-only FS fallback) so redirects still work.

## New / changed files

- `prisma/schema.prisma`, `prisma/migrations/…`, `prisma.config.ts`
- `lib/prisma.ts` — server-only Prisma singleton (`@prisma/adapter-pg` + `pg`)
- `lib/brokers/click-store.ts` — Prisma persistence
- `lib/generated/prisma/` — generated client (gitignored)
- `.env.example` — `DATABASE_URL` placeholder
- `package.json` — `prisma`, `@prisma/client`, `postinstall` / `db:*` scripts

## How to run locally

1. Copy `.env.example` → `.env.local` and set `DATABASE_URL`.
2. Start Postgres and run `npx prisma migrate deploy`.
3. `npm run dev` — broker redirect/clicks write to `BrokerClick`.
4. `npm run build` — runs `prisma generate` then `next build`.

## Pending items

- Apply migration to production/staging Postgres
- Optional: seed `Broker` table from static catalog
- Wire `Watchlist` / `Alert` when `features.watchlist` is enabled
- Optional: migrate historical `broker-clicks.jsonl` into `BrokerClick`
- Replace local `DATABASE_URL` placeholder with hosted Postgres (e.g. Neon) for deployed environments
