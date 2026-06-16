# Sprint 4 — Authentication & Watchlist Foundation Audit

Date: 2026-06-16  
Scope: NextAuth v5 (Auth.js) + Prisma adapter, credentials auth, persisted watchlist. No UI redesign, no new OAuth providers, no new market features.

## Architecture

```
┌─────────────┐     credentials      ┌──────────────────┐
│ /login      │ ─────────────────► │ auth.ts          │
│ /register   │                    │ NextAuth v5      │
└─────────────┘                    │ PrismaAdapter    │
       │                           │ JWT sessions     │
       │ POST /api/auth/register   └────────┬─────────┘
       └──────────────────────────────────►│
                                            ▼
                                   ┌──────────────────┐
                                   │ PostgreSQL       │
                                   │ User, Account,   │
                                   │ Session,         │
                                   │ Watchlist,       │
                                   │ WatchlistItem    │
                                   └──────────────────┘

Guest watchlist ──► localStorage (Zustand persist)
Logged-in watchlist ──► GET/POST/DELETE /api/watchlist ──► Prisma
```

### Session strategy

- **Provider:** Credentials only (email + password). No Google/GitHub/Discord.
- **Adapter:** `@auth/prisma-adapter` connected to `lib/prisma.ts`.
- **Sessions:** JWT (`session.strategy: "jwt"`) — required for Credentials provider in Auth.js v5.
- **Account/Session tables:** Present for adapter compatibility and future OAuth; JWT is used for active sessions.

### Watchlist persistence

- Each user gets a default `Watchlist` named `"Default"` on first access.
- Items map to `WatchlistSymbol` codes from `lib/watchlist.ts`.
- Guest users keep device-local storage; authenticated users sync via API.

## Environment variables

| Variable | Required | Description |
|----------|----------|-------------|
| `DATABASE_URL` | Yes | PostgreSQL connection string (existing) |
| `AUTH_SECRET` | Yes | Auth.js secret for signing JWTs/cookies. Generate: `openssl rand -base64 32` |
| `NEXTAUTH_URL` | Yes (prod) | Canonical app URL, e.g. `http://localhost:3000` |

Added to `.env.example` only. Do **not** commit `.env.local`.

## Schema changes (Sprint 4 migration)

Migration: `prisma/migrations/20250616130000_sprint4_auth/migration.sql`

### User (extended)

- `emailVerified DateTime?`
- `image String?`
- `passwordHash String?` — bcrypt hash for credentials login

### New Auth.js models

- `Account` — OAuth linkage (unused for credentials-only, required by adapter)
- `Session` — database sessions (adapter; JWT used at runtime)
- `VerificationToken` — magic-link / email verification (future)

Existing `Watchlist` / `WatchlistItem` models unchanged from Sprint 3.

Apply migration:

```bash
npm run db:migrate
# or: npx prisma migrate deploy
```

## Files created

| Path | Purpose |
|------|---------|
| `auth.ts` | NextAuth config: Credentials provider, Prisma adapter, JWT callbacks |
| `types/next-auth.d.ts` | Session type extension (`user.id`) |
| `lib/auth/password.ts` | bcrypt hash/verify |
| `lib/watchlist-service.ts` | Server-side watchlist CRUD via Prisma |
| `app/api/auth/[...nextauth]/route.ts` | Auth.js route handlers |
| `app/api/auth/register/route.ts` | User registration |
| `app/api/watchlist/route.ts` | Protected watchlist API |
| `app/login/page.tsx` | Login form (minimal) |
| `app/register/page.tsx` | Registration form (minimal) |
| `components/providers/session-provider.tsx` | Client `SessionProvider` |
| `components/marketwall/auth-buttons.tsx` | Header login/register/logout wiring |
| `components/marketwall/watchlist-session-sync.tsx` | Guest ↔ remote watchlist switch |
| `components/ui/label.tsx` | Form label for auth pages |
| `prisma/migrations/20250616130000_sprint4_auth/migration.sql` | Auth tables migration |

## Files changed

| Path | Change |
|------|--------|
| `prisma/schema.prisma` | Auth.js models + User extensions |
| `package.json` | `next-auth@beta`, `@auth/prisma-adapter`, `bcryptjs` |
| `.env.example` | `AUTH_SECRET`, `NEXTAUTH_URL` |
| `lib/config/features.ts` | `watchlist: true` |
| `lib/store/watchlist-store.ts` | Remote sync when authenticated |
| `lib/i18n.tsx` | Auth + watchlist.synced strings |
| `components/marketwall/header.tsx` | `AuthButtons` instead of static placeholders |
| `components/marketwall/sidebar.tsx` | `WatchlistSessionSync` |
| `components/marketwall/watchlist.tsx` | Synced vs local privacy hint |
| `app/layout.tsx` | `AuthSessionProvider` wrapper |

## API routes

### Auth

| Method | Route | Auth | Description |
|--------|-------|------|-------------|
| GET/POST | `/api/auth/[...nextauth]` | Public | Auth.js handlers (sign-in, sign-out, session) |
| POST | `/api/auth/register` | Public | Create user `{ email, password, name? }` |

### Watchlist (protected)

| Method | Route | Body / query | Response |
|--------|-------|--------------|----------|
| GET | `/api/watchlist` | — | `{ symbols: string[] }` |
| POST | `/api/watchlist` | `{ symbol }` or `{ symbols: string[] }` | `{ symbols: string[] }` |
| DELETE | `/api/watchlist?symbol=VNINDEX` | query `symbol` | `{ symbols: string[] }` |

All watchlist routes return `401` without a valid session.

Existing market/broker/heatmap APIs are unchanged.

## Feature flags

```ts
// lib/config/features.ts
watchlist: true  // was false — enables sidebar watchlist + DB sync path
```

## Client hooks

- `useSession()` from `next-auth/react` — header auth state, watchlist sync
- `useWatchlist()` — unchanged public API; store syncs to API when logged in

## Login / logout flow

1. **Register:** `POST /api/auth/register` → auto sign-in via credentials → redirect `/`
2. **Login:** `/login` → `signIn("credentials")` → redirect home or `callbackUrl`
3. **Logout:** Header “Log out” → `signOut({ callbackUrl: "/" })`

## Dependencies added

- `next-auth@^5.0.0-beta.31`
- `@auth/prisma-adapter@^2.11.2`
- `bcryptjs@^3.0.3`
- `@types/bcryptjs` (dev)

## Verification checklist

- [ ] Set `AUTH_SECRET` and `NEXTAUTH_URL` in `.env.local` (operator — not committed)
- [ ] Run migration against Neon (see **Migration (Neon)** below)
- [ ] Register → login → add/remove watchlist symbols → refresh → symbols persist (manual QA)
- [ ] Logout → watchlist reverts to localStorage mode (manual QA)
- [x] `npx prisma generate` — passes (2026-06-16)
- [x] `npm run build` — passes (2026-06-16, Next.js 16.2.6)
- [x] Existing market/broker/heatmap API routes still present in build output

## Sprint 4 task completion

| # | Task | Status |
|---|------|--------|
| 1 | NextAuth installed (`next-auth@^5.0.0-beta.31`) | Done |
| 2 | Prisma Adapter configured (`auth.ts` → `PrismaAdapter(prisma)`) | Done |
| 3 | Credentials auth flow (login/register pages + `/api/auth/register`) | Done |
| 4 | User model connected (`User.passwordHash`, authorize in Credentials) | Done |
| 5 | Watchlist persistence via Prisma (`lib/watchlist-service.ts`) | Done |
| 6 | WatchlistItem connected (default list + CRUD on items) | Done |
| 7 | Session handling (server `auth()`, client `SessionProvider` / `useSession`) | Done |
| 8 | Protected watchlist API (GET/POST/DELETE `/api/watchlist`) | Done |

## Final status (2026-06-16)

**Audit result:** Sprint 4 implementation was already present in the working tree. Re-audit found all eight tasks complete; no code gaps required filling.

**Build:**

```text
npx prisma generate  → OK (Prisma Client 7.8.0 → lib/generated/prisma)
npm run build        → OK (compiled + TypeScript + 43 static pages)
```

**What existed (unchanged this pass):** Auth config, Prisma schema + migration, register/login UI, watchlist API + service, session provider, header auth buttons, watchlist session sync, i18n strings, feature flag `watchlist: true`.

**What was added this pass:** Final audit verification, checklist/build updates in this document only.

**Blockers:** None for build/typecheck. Runtime auth/watchlist requires `DATABASE_URL`, `AUTH_SECRET`, and applied migration on Neon.

## Migration (Neon)

Schema change is in `prisma/migrations/20250616130000_sprint4_auth/migration.sql`:

- Extends `User` with `emailVerified`, `image`, `passwordHash`
- Adds `Account`, `Session`, `VerificationToken` (Auth.js adapter)

Apply to Neon (production/staging):

```bash
# Ensure DATABASE_URL in .env.local points at your Neon branch
npx prisma migrate deploy
# or locally during dev:
npm run db:migrate
```

After migrate, confirm tables exist in Neon console: `User`, `Account`, `Session`, `VerificationToken`, `Watchlist`, `WatchlistItem`.

## Known limitations / follow-ups

- No email verification or password reset (Sprint 5+).
- No OAuth providers by design.
- JWT sessions: `Session` table not written on each login (adapter + JWT combo).
- Registration does not seed watchlist in DB until first GET/POST watchlist call (lazy default list).
