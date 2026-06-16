# MarketWall — Project Specification

**Stack:** Next.js 16, TypeScript, Tailwind CSS, Shadcn UI, SWR  
**Data:** Twelve Data (market quotes), static broker catalog (Prisma-ready types)  
**Last updated:** 2026-06-16

## Sprint Progress

### Sprint 1 — Twelve Data Market Engine ✅

| Item | Status | Location |
|------|--------|----------|
| Market types | ✅ | `types/market.ts` |
| Symbol registry | ✅ | `config/market-symbols.ts` |
| Twelve Data client (server-only, retry, cache) | ✅ | `lib/twelvedata/client.ts` |
| Quote normalization | ✅ | `lib/market/normalize.ts` |
| Currency strength engine | ✅ | `lib/market/currency-strength.ts` |
| Markets overview API | ✅ | `app/api/markets/overview/route.ts` |
| Symbol detail API | ✅ | `app/api/markets/[symbol]/route.ts` |
| Currency strength API | ✅ | `app/api/currency-strength/route.ts` |
| Heatmap APIs | ✅ | `app/api/heatmaps/[market]/route.ts` (+ legacy per-market routes) |
| Dashboard wiring (ticker, overview, strength) | ✅ | `components/marketwall/*`, `hooks/useQuotes.ts` |
| EN/VI unavailable message | ✅ | `lib/i18n.tsx` → `error.marketDataUnavailable` |

### Sprint 2 — Broker Module (foundation) ✅

| Item | Status | Location |
|------|--------|----------|
| Broker schema types (Prisma-ready) | ✅ | `types/broker.ts` |
| Broker registry + slugs | ✅ | `lib/brokers/registry.ts` |
| Affiliate URL builder | ✅ | `lib/brokers/affiliate.ts` |
| Click logging (file-based) | ✅ superseded by Sprint 3 | `lib/brokers/click-store.ts` |
| Redirect service | ✅ | `app/api/brokers/redirect/route.ts` |
| Comparison engine | ✅ | `lib/brokers/compare.ts` |
| `/brokers` listing (enhanced links) | ✅ | `app/brokers/page.tsx` |
| `/brokers/[slug]` detail | ✅ | `app/brokers/[slug]/page.tsx` |
| `/compare/[pair]` comparison | ✅ | `app/compare/[pair]/page.tsx` |

### Sprint 3 — PostgreSQL + Prisma ✅

| Item | Status | Location |
|------|--------|----------|
| Prisma schema (User, Watchlist, Alert, Broker, BrokerClick) | ✅ | `prisma/schema.prisma` |
| Migration SQL | ✅ generated | `prisma/migrations/20250616120000_sprint3_init/` |
| Prisma client singleton | ✅ | `lib/prisma.ts` |
| Broker click persistence (Postgres) | ✅ | `lib/brokers/click-store.ts` |
| Database audit | ✅ | `SPRINT3_DATABASE_AUDIT.md` |

## Environment

```env
TWELVE_DATA_API_KEY=...        # required for live market data
BROKER_AFFILIATE_ID=marketwall # optional affiliate ref param
DATABASE_URL=...               # PostgreSQL — broker clicks (Prisma)
```

## Constraints

- UI/UX locked — no layout redesigns
- No trading signals or Buy/Sell/Entry/TP/SL language
- Platform comparison and market information only

## Future (not in scope)

- Broker catalog seed/sync into Postgres `Broker` table
- Real-time WebSocket quotes
