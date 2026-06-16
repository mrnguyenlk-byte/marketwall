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

### Sprint 5 — Currency Strength (28-pair model) ✅

| Item | Status | Location |
|------|--------|----------|
| 28-pair relative strength engine | ✅ | `lib/currency-strength/*` |
| Twelve Data 28-pair fetch | ✅ | `config/market-symbols.ts`, `lib/twelvedata/client.ts` |
| Live-only calculation (no mock blend) | ✅ | `lib/market/currency-strength.ts` |
| 1D snapshot chart (flat lines) | ✅ | `components/marketwall/currency-strength.tsx` |
| VND removed from strength | ✅ | types, mock, UI |
| Currency strength unavailable i18n | ✅ | `lib/i18n.tsx` → `error.currencyStrengthUnavailable` |
| Sprint audit | ✅ | `SPRINT5_CURRENCY_STRENGTH_AUDIT.md` |

### Sprint 5 — Realtime Market Data ✅

| Item | Status | Location |
|------|--------|----------|
| Twelve Data WebSocket server relay | ✅ | `lib/twelvedata/ws-relay.ts` |
| SSE stream endpoint | ✅ | `app/api/realtime/stream/route.ts` |
| REST initial load (unchanged) | ✅ | `/api/markets/overview`, `/api/currency-strength`, heatmaps |
| Client SSE provider | ✅ | `lib/realtime/realtime-context.tsx` |
| Ticker + overview live merge | ✅ | `hooks/useQuotes.ts` |
| Currency strength live merge | ✅ | `hooks/useCurrencyStrength.ts` |
| Heatmap price/change overlay | ✅ | `components/marketwall/heatmap.tsx` |
| Feature flag | ✅ | `features.realtimeStream` in `lib/config/features.ts` |
| Sprint audit | ✅ | `SPRINT5_REALTIME_AUDIT.md` |

### Sprint 5 — Data Quality & Live-First Heatmaps ✅

| Item | Status | Location |
|------|--------|----------|
| Heatmap REST live-first (VN/US/crypto) | ✅ | `lib/market/heatmap.ts`, `components/marketwall/heatmap.tsx` |
| US 100 large-cap universe | ✅ | `config/heatmap-symbols.ts` |
| Crypto 50 / VN 100 tile caps | ✅ | `lib/market/heatmap.ts`, providers |
| Server cache TTLs (forex/crypto/heatmap) | ✅ | `lib/providers/cache.ts` |
| Mock isolated to API fallback | ✅ | `toApiJson().fallback`, heatmap/currency providers |
| Consolidated sprint audit | ✅ | `SPRINT5_DATA_REALTIME_AUDIT.md` |

## Environment

```env
TWELVE_DATA_API_KEY=...        # required for live market data + WebSocket relay (server-only)
BROKER_AFFILIATE_ID=marketwall # optional affiliate ref param
DATABASE_URL=...               # PostgreSQL — broker clicks (Prisma)
```

Realtime: browser connects to `GET /api/realtime/stream` (SSE). The server relay connects to Twelve Data WebSocket using `TWELVE_DATA_API_KEY` — the key is never exposed to the client. Disable via `features.realtimeStream` in `lib/config/features.ts`.

## Constraints

- UI/UX locked — no layout redesigns
- No trading signals or Buy/Sell/Entry/TP/SL language
- Platform comparison and market information only

## Future (not in scope)

- Broker catalog seed/sync into Postgres `Broker` table
