# Sprint 5 — Realtime Market Data Audit

**Date:** 2026-06-16  
**Scope:** Twelve Data WebSocket server-side relay → SSE → MarketWall widgets  
**Build:** `npm run build` (see Build section)

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────────────┐
│ Browser (MarketWall)                                                     │
│  RealtimeProvider ──EventSource──► GET /api/realtime/stream?channels=…  │
│       │                                    │                             │
│       ├── useQuotes()          REST ◄──────┼──► /api/markets/overview   │
│       ├── useCurrencyStrength() REST ◄─────┼──► /api/currency-strength   │
│       └── heatmap.tsx overlay    REST ◄────┼──► /api/heatmaps/*         │
└────────────────────────────────────────────┼─────────────────────────────┘
                                             │ SSE (text/event-stream)
┌────────────────────────────────────────────▼─────────────────────────────┐
│ Next.js Route Handler (server-only)                                       │
│  app/api/realtime/stream/route.ts                                         │
│       │ subscribe()                                                       │
│       ▼                                                                   │
│  lib/twelvedata/ws-relay.ts  (globalThis singleton)                       │
│       │ one upstream WebSocket, multiplexed to SSE clients                │
│       ▼                                                                   │
│  wss://ws.twelvedata.com/v1/quotes/price?apikey=TWELVE_DATA_API_KEY      │
└──────────────────────────────────────────────────────────────────────────┘
```

**Data flow**

1. Widgets load initial state via existing REST APIs (SWR, 30–60s cache).
2. `RealtimeProvider` opens a single browser `EventSource` to `/api/realtime/stream`.
3. The route handler seeds pair/quote baselines from REST, then attaches the client to the shared relay.
4. The relay maintains one Twelve Data WebSocket, subscribes to the union of symbols for active channels, and pushes `quote` / `currency-strength` / `status` events over SSE.
5. Hooks merge live ticks onto REST rows (`lib/realtime/merge-quotes.ts`). If SSE or WS is unavailable, SWR continues with cached REST and `fallback: true`.

---

## Environment Variables

| Variable | Required | Exposure | Purpose |
|----------|----------|----------|---------|
| `TWELVE_DATA_API_KEY` | Yes (live data) | **Server only** — used in `lib/twelvedata/client.ts` and `lib/twelvedata/ws-relay.ts` | REST quotes + upstream WebSocket |
| `DATABASE_URL` | No (realtime) | Server | Unchanged — auth/brokers |
| `BROKER_AFFILIATE_ID` | No | Server | Unchanged |

**Never** prefix with `NEXT_PUBLIC_`. The browser only talks to `/api/realtime/stream`; the API key is not sent to clients.

---

## Feature Flags

| Flag | Location | Default | Effect |
|------|----------|---------|--------|
| `features.liveClientFetch` | `lib/config/features.ts` | `true` | Enables REST SWR for market widgets |
| `features.realtimeStream` | `lib/config/features.ts` | `true` | Enables `RealtimeProvider` + SSE overlay |

Set `realtimeStream: false` to disable EventSource while keeping REST.

---

## Endpoint Contracts

### `GET /api/realtime/stream`

**Query:** `channels` — comma-separated list (default: `overview`)

| Channel | Twelve Data symbols | Widget |
|---------|---------------------|--------|
| `overview` | `OVERVIEW_SYMBOLS` (GOLD, SILVER, DXY, FX, crypto, indices) | Ticker bar, market overview |
| `currency-strength` | 28 FX pairs (`CURRENCY_STRENGTH_PAIRS`) | Currency strength |
| `heatmap-us` | AAPL, MSFT, NVDA, GOOGL, META, TSLA, AMZN | US heatmap tiles (price/change %) |
| `heatmap-crypto` | BTC/USD, ETH/USD, SOL/USD, BNB/USD, XRP/USD, ADA/USD | Crypto heatmap tiles |

**Response:** `text/event-stream`

Each message: `data: {JSON}\n\n`

| Event `type` | Payload | When |
|--------------|---------|------|
| `status` | `{ connected, fallback, message? }` | Connect, WS state change, errors |
| `quote` | `{ symbol, apiSymbol, price, changePercent, updatedAt }` | Twelve Data price tick |
| `currency-strength` | `{ items: [{ currency, strength, change, label }], updatedAt }` | After FX pair tick + ≥12 pairs cached |

**Example**

```
GET /api/realtime/stream?channels=overview,currency-strength,heatmap-us,heatmap-crypto
```

### Existing REST (unchanged, used for initial load + fallback)

| Route | Cache TTL | Realtime overlay |
|-------|-----------|------------------|
| `/api/markets/overview` | 30s | Yes — ticker, overview |
| `/api/currency-strength` | 60s | Yes — strength scores |
| `/api/heatmaps/us` | 60s | Partial — detail heatmap uses mock layout + live US symbols |
| `/api/heatmaps/crypto` | 60s | Partial — detail heatmap uses mock layout + live crypto symbols |
| `/api/vietnam-markets` | 60s | **REST only** (no Twelve Data VN equities WS) |
| `/api/global-markets` | 60s | **REST only** |
| `/api/crypto` | 60s | **REST only** (CoinGecko; BTC/ETH also on overview WS) |

---

## Widget Matrix

| Widget | Initial load | Live updates | Fallback |
|--------|--------------|--------------|----------|
| Ticker bar | REST `/api/markets/overview` + VN/global/crypto REST | SSE `quote` (overview channel) | SWR revalidation; static SSR props if `liveClientFetch` off |
| Market overview | Same | SSE `quote` | Same |
| Currency strength (8 CCY, no VND) | REST `/api/currency-strength` | SSE `currency-strength` (server recalc from 28 pairs) | REST cache; unavailable message if live pairs insufficient |
| Heatmap (detail modal path) | Mock tile layout | SSE price overlay for US/crypto symbols | Mock prices unchanged for VN |
| Legacy VN heatmap | `/api/vietnam-markets` | REST only | Static/mock tiles |

**Currency strength chart:** Flat 1D snapshot lines only (`buildStrengthSeries` — no synthetic intraday curves). Verified in `lib/currency-strength/calculate-strength.ts`.

---

## Connection Pooling Tradeoffs

| Approach | Used here | Pros | Cons |
|----------|-----------|------|------|
| **Singleton upstream WS + SSE fan-out** | Yes (`globalThis.__twelveDataWsRelay`) | One Twelve Data connection (limit: 3 per API key); efficient on `next start` / long-lived Node | Cold serverless invocations recreate relay; pooling only across warm instances |
| Per-SSE upstream WS | No | Isolated; works on stateless lambdas | Burns Twelve Data connection quota; higher latency/cost |
| Browser → Twelve Data direct | **Forbidden** | — | Exposes API key |

Twelve Data allows up to **3 concurrent WebSocket connections** per API key. This implementation uses **one** shared connection in the relay.

---

## Vercel / Serverless Limitations

1. **SSE duration:** Vercel function max duration applies (Hobby ~60s, Pro configurable). Clients reconnect automatically via `EventSource` on error.
2. **No persistent WS across cold starts:** `globalThis` relay survives **warm** invocations only; cold starts open a new upstream WS.
3. **WebSocket client:** Requires Node.js global `WebSocket` (Node 20+). If unavailable, relay sets `fallback: true` and clients use REST only.
4. **Twelve Data plan:** WebSocket streaming requires Pro plan or higher; Basic/Grow trial lists are limited.
5. **Edge runtime:** Route uses `runtime = "nodejs"` — WebSocket upstream is not supported on Edge.

---

## Fallback Behavior

| Condition | Server | Client |
|-----------|--------|--------|
| Missing `TWELVE_DATA_API_KEY` | SSE sends `status.fallback: true`; no WS connect | REST only; `fallback: true` on API responses |
| WS connect fails / drops | Relay reconnects with exponential backoff; `status` events | `useQuotes` / `useCurrencyStrength` keep SWR data; `isRealtime: false` |
| SSE disconnect | — | EventSource retries; widgets show last REST merge |
| Insufficient FX pairs for strength | No `currency-strength` SSE events | REST snapshot or unavailable state |
| Explicit mock | API returns `source: "mock"` only in error paths | Currency strength shows unavailable when `source: "mock"` |

Mock data is **not** blended with live ticks. Live overlay applies only when `source: "live"` or active SSE connection.

---

## Files Created / Changed

### Created

| File | Purpose |
|------|---------|
| `lib/realtime/types.ts` | SSE event types |
| `lib/realtime/symbols.ts` | Channel → symbol registry |
| `lib/realtime/merge-quotes.ts` | Client merge helpers |
| `lib/realtime/realtime-context.tsx` | `RealtimeProvider` + hooks |
| `lib/twelvedata/ws-relay.ts` | Server WebSocket relay singleton |
| `app/api/realtime/stream/route.ts` | SSE endpoint |
| `SPRINT5_REALTIME_AUDIT.md` | This document |

### Changed

| File | Change |
|------|--------|
| `lib/config/features.ts` | Added `realtimeStream` flag |
| `hooks/useQuotes.ts` | REST + SSE merge |
| `hooks/useCurrencyStrength.ts` | REST + SSE strength overlay |
| `components/marketwall/heatmap.tsx` | Live price overlay for US/crypto heatmap |
| `app/layout.tsx` | Wrapped app in `RealtimeProvider` |
| `docs/PROJECT_SPEC.md` | Sprint 5 realtime section |

### Unchanged (by design)

- UI layout/components (ticker, overview, strength visuals)
- `lib/contact.ts`, auth, broker modules
- Existing REST route response shapes (optional `realtime` only on client hooks)

---

## Security Checklist

- [x] `TWELVE_DATA_API_KEY` never sent to browser
- [x] Relay marked `import "server-only"`
- [x] SSE route runs on Node.js runtime
- [x] No trading-signal language added

---

## Build

Run: `npm run build`

**Result (2026-06-16):** ✅ Pass — Next.js 16.2.6, TypeScript clean, `/api/realtime/stream` listed as dynamic route.

---

## Known Blockers / Notes

1. **Twelve Data WebSocket plan gate** — Without Pro+, upstream WS may reject subscriptions; REST fallback still works.
2. **VN heatmap / indices** — No Twelve Data realtime for VN equities; remains REST/mock.
3. **Serverless SSE length** — Long-lived dashboards rely on EventSource auto-reconnect.
4. **Change % on WS ticks** — Derived from REST `open` baseline when merging on client; first tick before REST may show 0% change until overview loads.
