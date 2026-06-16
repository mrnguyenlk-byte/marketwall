# Sprint 5 — Data Quality & Realtime Audit

> **Template note:** New sprint audits should follow this file's structure. Agents auto-generate `SPRINT_X_AUDIT.md` per [`.cursor/rules/sprint-deploy-workflow.mdc`](.cursor/rules/sprint-deploy-workflow.mdc) after each sprint deploy.

**Date:** 2026-06-16  
**Scope:** Live-first MarketWall data, 28-pair currency strength, heatmap REST APIs, SSE realtime, server cache  
**Build:** `npm run build` ✅

---

## What Already Existed (prior subagents)

| Area | Status | Key files |
|------|--------|-----------|
| 28-pair currency strength (8 majors, no VND) | ✅ Done | `lib/currency-strength/*`, `SPRINT5_CURRENCY_STRENGTH_AUDIT.md` |
| Flat 1D strength snapshot chart | ✅ Done | `buildStrengthSeries()` — no fake intraday |
| Twelve Data WS relay → SSE | ✅ Done | `lib/twelvedata/ws-relay.ts`, `app/api/realtime/stream/route.ts` |
| RealtimeProvider + quote/strength merge | ✅ Done | `lib/realtime/*`, `hooks/useQuotes.ts`, `hooks/useCurrencyStrength.ts` |
| Heatmap REST route shells | ✅ Done | `app/api/heatmaps/{vietnam,us,crypto,[market]}` |
| Vietnam adapter + seed fallback | ✅ Done | `lib/providers/vietnam-market-provider.ts`, `lib/vietnam-heatmap-seeds.ts` |
| CoinGecko crypto top-50 provider | ✅ Done | `lib/providers/crypto-provider.ts` |

## What Was Added / Fixed (this pass)

| Area | Change | Files |
|------|--------|-------|
| Heatmap live-first (UI) | Detail heatmap fetches REST per market; mock removed from initial render | `components/marketwall/heatmap.tsx`, `lib/swr/use-market-apis.ts` |
| US heatmap live-first (API) | Twelve Data batch quotes over 100 large-cap seeds; mock only on failure | `config/heatmap-symbols.ts`, `lib/market/heatmap.ts`, `lib/twelvedata/client.ts` |
| Crypto heatmap live-first (API) | CoinGecko-first (50 assets); mock isolated to catch/fallback | `lib/market/heatmap.ts` |
| VN heatmap | Vietnam provider first; top 100 tiles by market cap | `lib/market/heatmap.ts` |
| Heatmap asset bridge | API `HeatmapAsset` → `MarketAsset` for `MarketHeatmap` | `lib/market/heatmap-assets.ts` |
| Detail modal data | Opens from live REST asset, not `findMockAsset` | `lib/heatmap-detail-context.tsx` |
| Currency strength loading | No mock placeholder while SWR loads | `components/marketwall/currency-strength.tsx` |
| Server cache TTLs | Forex 30s, crypto 45s, heatmaps 3m, overview 30s | `lib/providers/cache.ts`, API routes, providers |
| Realtime symbol expansion | US top 20 + crypto top 10 on WS channels | `config/heatmap-symbols.ts`, `lib/realtime/symbols.ts` |
| Stock batch quotes | `getStockQuotes()` with equity symbol defs | `lib/twelvedata/client.ts`, `lib/market/normalize.ts` |

---

## Currency Strength Formula

**28 FX pairs** → eight majors: USD, EUR, GBP, JPY, AUD, NZD, CAD, CHF (**VND excluded**).

1. Fetch daily `% change` per pair (Twelve Data batch).
2. For each pair BASE/QUOTE: BASE `+= change%`, QUOTE `-= change%`.
3. Average per currency by pair appearances.
4. Zero-mean normalize: `(avg − mean) × 12`, score `= clamp(50 + normalized, 0, 100)`.
5. Gates: ≥12 pairs used, each currency in ≥2 pairs, all 8 rows → else `unavailable: true`.

**Chart:** flat 2-point snapshot (Open → Close), not intraday time series.

See `SPRINT5_CURRENCY_STRENGTH_AUDIT.md` for full pair list.

---

## Removed / Isolated Mock & Fake Data

| Location | Before | After |
|----------|--------|-------|
| `components/marketwall/heatmap.tsx` | `getMockHeatmapAssets()` on every tab | REST `/api/heatmaps/*` via `useHeatmapMarket` |
| `components/marketwall/currency-strength.tsx` | Mock placeholder while loading | Empty until live REST/SSE |
| `lib/market/heatmap.ts` US path | Mock layout + global mock overlay | Twelve Data live quotes; mock only on failure |
| `lib/market/heatmap.ts` crypto path | Mock-first with partial TD overlay | CoinGecko live-first |
| `lib/heatmap-detail-context.tsx` | `findMockAsset(symbol)` | Full `MarketAsset` from REST tile |
| `lib/market/currency-strength.ts` | (already fixed) no reference-quote injection | Live pairs only |
| API responses | `source: "mock"` on error | `source: "mock"` + `fallback: true` via `toApiJson()` |

Mock files retained as **explicit fallback only**: `lib/mockHeatmapData.ts`, `lib/currency-strength-mock.ts`, provider `getMockData()`.

---

## Heatmap Symbol Counts

| Market | Universe | Live source | Fallback |
|--------|----------|-------------|----------|
| Vietnam | **100** tiles (VN30 + HOSE/HNX/UPCOM seeds, capped by market cap) | Vietnam adapters → seeds | `vietnam-market-provider` mock |
| US | **100** large-cap tickers (`config/heatmap-symbols.ts`) | Twelve Data `getStockQuotes()` | `lib/mockHeatmapData.ts` (7 symbols) |
| Crypto | **50** assets | CoinGecko markets API | `crypto-provider` mock defs |

---

## Realtime / Polling Implementation

```
Browser EventSource → GET /api/realtime/stream?channels=overview,currency-strength,heatmap-us,heatmap-crypto
                              ↓
                    lib/twelvedata/ws-relay.ts (singleton, server-only)
                              ↓
                    wss://ws.twelvedata.com (TWELVE_DATA_API_KEY never in browser)
```

| Widget | Initial load | Live overlay | Polling fallback |
|--------|--------------|--------------|------------------|
| Ticker / overview | `/api/markets/overview` (30s cache) | SSE `quote` | SWR revalidation |
| Currency strength | `/api/currency-strength` (30s cache) | SSE `currency-strength` | REST cache |
| Heatmap US/crypto | `/api/heatmaps/{us,crypto}` (3m cache) | SSE price overlay (top 20 US / 10 crypto) | REST rows |
| Heatmap VN | `/api/heatmaps/vietnam` (3m cache) | REST only (no VN equity WS) | Vietnam provider cache |

Feature flags: `features.liveClientFetch`, `features.realtimeStream` in `lib/config/features.ts`.

---

## Server-Side Cache TTLs

| Key | TTL | Route / provider |
|-----|-----|------------------|
| `CACHE_TTL.forex` (30s) | 30s | `/api/currency-strength` |
| `CACHE_TTL.overview` (30s) | 30s | `/api/markets/overview` |
| `CACHE_TTL.crypto` (45s) | 45s | `crypto-provider` |
| `CACHE_TTL.heatmap` (180s) | 3m | `/api/heatmaps/*`, `vietnam-market-provider` |

Implementation: `lib/providers/cache.ts` in-memory `cachedProvider()`.

---

## Remaining API Limitations

1. **Twelve Data WebSocket** — Requires Pro+ plan; without it, `status.fallback: true` and REST-only.
2. **US heatmap live** — Batch quote may return partial symbols on lower tiers; falls back to mock if &lt;20 live prices.
3. **VN heatmap realtime** — No Twelve Data VN equity stream; REST/adapters only.
4. **Serverless SSE** — Vercel function duration limits; EventSource auto-reconnects.
5. **Change % on WS ticks** — Derived from REST open baseline until overview loads.
6. **Intraday currency strength** — Not implemented; snapshot bars only.

---

## Build Result

```
npm run build
✓ Compiled successfully
✓ TypeScript clean
✓ 43 static pages generated
```

**Blockers:** None for build. Live WS requires valid `TWELVE_DATA_API_KEY` + compatible Twelve Data plan at runtime.

---

## Related Audits

- `SPRINT5_CURRENCY_STRENGTH_AUDIT.md` — 28-pair engine detail
- `SPRINT5_REALTIME_AUDIT.md` — SSE/WS architecture detail
