# MarketWall Data Audit Report

**Generated:** 2026-06-15  
**Scope:** Data pipeline only (no UI, heatmap layout, or Daily Analysis changes)  
**Runtime probe:** `GET /api/data-health`

---

## Executive Summary

| Area | Primary Provider | Real-time Level | Reliability (1–5) | Paid API Needed Now? |
|------|------------------|-----------------|-------------------|----------------------|
| Vietnam stocks / heatmap | VPS Datafeed | Near real-time (session) | 4 | No |
| Vietnam indices / leaderboards | VPS + KBS enrichment | Near real-time | 4 | No |
| Foreign flow | VPS (derived) | Intraday (today only) | 3 | Optional |
| Proprietary flow | CafeF EOD → PostgreSQL | EOD only | 3 | No |
| US heatmap | Yahoo Finance | 15-min delayed typical | 3 | No |
| Crypto | CoinGecko | ~1 min | 4 | No |
| Global macro (Gold/DXY/Oil) | Yahoo + Stooq | Delayed / EOD fallback | 3 | No |
| Fear & Greed | Computed + Alternative.me | Mixed | 3 | No |
| Economic calendar | Trading Economics / Fair Economy | Event-driven | 2 | Optional |

**Overall data quality score: 3.4 / 5** — Production-viable for a free-tier dashboard. Vietnam core quotes are strong via VPS. Gaps are proprietary timeliness, foreign-flow history, US delay, and calendar reliability.

**Paid realtime API recommendation:** **Defer purchase.** Current free stack covers VN session quotes adequately. Revisit paid APIs when you need: (1) guaranteed US realtime, (2) authoritative VN foreign/proprietary exchange feeds, or (3) SLA-backed uptime.

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         Dashboard / API Routes                          │
│  /api/heatmaps/*  /api/markets/*  /api/crypto  /api/global-markets    │
└───────────────────────────────────┬─────────────────────────────────────┘
                                    │
┌───────────────────────────────────▼─────────────────────────────────────┐
│                    lib/providers/* + lib/market/heatmap.ts              │
│         withFallback / chainProviders + in-memory cache (cache.ts)      │
└───────┬─────────────┬──────────────┬──────────────┬─────────────────────┘
        │             │              │              │
   Vietnam         US/Crypto      Global Macro    Proprietary
   adapters        providers      providers       CafeF → Prisma
   VPS→KBS→…       Yahoo          Yahoo/Stooq     cron sync
```

### Vietnam adapter chain (priority order)

1. **VPS** — `bgapidatafeed.vps.com.vn` (primary heatmap)
2. **KBS** — `kbbuddywts.kbsec.com.vn` (indices, leaderboards, fallback quotes)
3. **TCBS** — `apipubaws.tcbs.com.vn` (public fallback)
4. **Vietstock** — stub (requires contract + `VIETSTOCK_API_KEY`)
5. **FireAnt** — stub (requires `FIREANT_API_KEY`)

Registry: `lib/adapters/vietnam/registry.ts`

---

## Provider Reference

### VPS (Vietnam)

| Field | Value |
|-------|-------|
| **Files** | `lib/adapters/vietnam/vps-adapter.ts`, `lib/vietnam/vn-change-sign.ts`, `lib/vietnam/volume-units.ts` |
| **Endpoint** | `https://bgapidatafeed.vps.com.vn` (batch quotes) |
| **Fields** | `sym`, `lastPrice`, `closePrice`, `changePc`, `r` (ref), `lot` (volume lots), `fBVol`, `fSVolume`, `avePrice` |
| **Timing** | Near real-time during HOSE/HNX/UPCOM session |
| **Cache TTL** | 300s via `CACHE_KEYS.vietnamMarkets` / heatmap |
| **Fallback** | KBS → TCBS → mock seeds |
| **Failure** | Adapter skipped; next in chain; ultimate mock via `withFallback` |

### KBS / Vnstock IIS

| Field | Value |
|-------|-------|
| **Files** | `lib/adapters/vietnam/kbs-adapter.ts`, `lib/providers/kbs-client.ts` |
| **Endpoints** | `POST /stock/iss`, index snapshots, ranking APIs, foreign top lists |
| **Fields** | Price, change, volume, value, foreign buy/sell rankings |
| **Timing** | Near real-time (session) |
| **Cache TTL** | Inherited from Vietnam provider (300s) |
| **Fallback** | Used as enrichment when VPS primary succeeds |
| **Failure** | Leaderboards may use VPS-derived dashboard only |

### TCBS

| Field | Value |
|-------|-------|
| **Files** | `lib/adapters/vietnam/tcbs-adapter.ts` |
| **Endpoint** | `https://apipubaws.tcbs.com.vn` |
| **Fields** | Index + limited stock overview |
| **Timing** | Near real-time / EOD mix |
| **Cache TTL** | 300s (Vietnam bundle) |
| **Fallback** | Fourth in adapter chain |
| **Failure** | Skipped on 404/empty |

### Vietstock (stub)

| Field | Value |
|-------|-------|
| **Files** | `lib/adapters/vietnam/vietstock-adapter.ts` |
| **Endpoint** | `VIETSTOCK_API_URL` (contract) |
| **Status** | `not_connected` — mapping only, no HTTP |
| **Failure** | Skipped unless API key + URL configured |

### FireAnt (stub)

| Field | Value |
|-------|-------|
| **Files** | `lib/adapters/vietnam/fireant-adapter.ts` |
| **Endpoint** | `https://restv2.fireant.vn` (documented, not wired) |
| **Status** | `not_connected` without `FIREANT_API_KEY` |
| **Failure** | Returns `not_configured` / `not_connected` |

### CafeF (proprietary EOD)

| Field | Value |
|-------|-------|
| **Files** | `lib/providers/proprietary/cafef-provider.ts`, `lib/proprietary/sync-cafef-eod.ts`, `lib/proprietary/heatmap-overlay.ts` |
| **Endpoint** | `https://cafef.vn/du-lieu/Ajax/PageNew/DataHistory/GDTuDoanh.ashx` |
| **Fields** | `GtMua`, `GtBan`, `KLcpMua`, `KlcpBan` per symbol/exchange |
| **Timing** | **EOD only** (post-market) |
| **Cache TTL** | DB-backed; live scrape 7-day lookback on stale |
| **Sync** | Cron `30 10 * * 1-5` → `/api/sync/proprietary-eod` (17:30 ICT) |
| **Fallback** | GTGD proxy label when data not from today; empty overlay → trading-value proxy in UI |
| **Failure** | `scheduleProprietaryEodSyncIfNeeded` fire-and-forget retry |

### Yahoo Finance

| Field | Value |
|-------|-------|
| **Files** | `lib/providers/yahoo-finance.ts`, `lib/providers/global-market-provider.ts`, `lib/market/heatmap.ts` |
| **Endpoints** | `query1.finance.yahoo.com/v8/finance/chart`, `/v7/finance/quote` |
| **Fields** | US stocks, indices, Gold (`GC=F`), Oil (`CL=F`), DXY (`DX-Y.NYB`), Silver |
| **Timing** | Typically 15-min delayed (unofficial API) |
| **Cache TTL** | US heatmap 300s; global quotes 60s |
| **Fallback** | Stooq CSV → mock |
| **Failure** | Partial live overlay on seed universe; mock if &lt;5 live prices |

### CoinGecko

| Field | Value |
|-------|-------|
| **Files** | `lib/providers/crypto-provider.ts` |
| **Endpoint** | `api.coingecko.com/api/v3/coins/markets` |
| **Fields** | price, 24h change, market cap, volume, rank |
| **Timing** | ~45s cache; near real-time |
| **Cache TTL** | 45s (`CACHE_TTL.crypto`) |
| **Fallback** | `MOCK_COIN_DEFS` (50 assets) |
| **Failure** | Mock if &lt;10 assets returned |

### Stooq

| Field | Value |
|-------|-------|
| **Files** | `lib/providers/global-market-provider.ts` |
| **Endpoint** | `stooq.com/q/l/?s=...&f=sd2t2ohlcv&h&e=csv` |
| **Fields** | OHLC CSV for global instruments |
| **Timing** | **EOD / delayed** |
| **Cache TTL** | 60s (global bundle) |
| **Fallback** | Third in global chain |
| **Failure** | Skipped; Yahoo preferred |

### Twelve Data

| Field | Value |
|-------|-------|
| **Files** | `lib/twelvedata/client.ts`, `lib/api/twelveData.ts` |
| **Usage** | Optional: WebSocket SSE relay (`lib/config/features.ts`), forex pairs |
| **Timing** | Real-time when `TWELVE_DATA_API_KEY` set |
| **Cache TTL** | Forex 60s |
| **Status** | **Not required** for current dashboard paths |

### Alpha Vantage

| Field | Value |
|-------|-------|
| **Files** | `lib/alphavantage/client.ts` |
| **Usage** | Currency strength FX pairs fallback |
| **Cache TTL** | 60s (`CACHE_KEYS.forexAlphaVantage`) |
| **Status** | Secondary to Twelve Data / Yahoo for FX |

### Alternative.me (Fear & Greed)

| Field | Value |
|-------|-------|
| **Files** | `lib/fear-greed/crypto.ts` |
| **Endpoint** | `api.alternative.me/fng/?limit=1` |
| **Timing** | Daily index |
| **Fallback** | Static `fearGreedData` mock |

### Trading Economics / Fair Economy (calendar)

| Field | Value |
|-------|-------|
| **Files** | `lib/providers/economic-provider.ts`, `lib/api/tradingEconomics.ts` |
| **Chain** | Trading Economics API → Fair Economy (Forex Factory) → legacy TE key → mock |
| **Cache TTL** | 600s |
| **Reliability** | Low without paid TE key |

### ECB / other

No direct ECB API in codebase. EUR strength derived via FX pairs (Yahoo / Twelve Data / Alpha Vantage).

---

## Module Cache & Refresh Table

| Module | Provider | Cache TTL | Real-time Level | Reliability |
|--------|----------|-----------|-----------------|-------------|
| Vietnam markets | VPS (+KBS enrich) | 300s | Near RT session | 4/5 |
| VN heatmap API | VPS + seeds | 300s | Near RT session | 4/5 |
| Foreign flow analytics | VPS derived | 300s | Intraday today | 3/5 |
| Proprietary flow | CafeF EOD → DB | None (DB) | EOD | 3/5 |
| US heatmap | Yahoo | 300s | Delayed ~15m | 3/5 |
| Crypto markets | CoinGecko | 45s | Near RT | 4/5 |
| Global quotes | Yahoo → Stooq | 60s | Delayed | 3/5 |
| Markets overview | Composite | 30s | Mixed | 3/5 |
| Currency strength | TD / AV / Yahoo | 300s | Delayed | 3/5 |
| Economic calendar | TE / Fair Economy | 600s | Event schedule | 2/5 |
| Fear & Greed VN | Computed (VPS+KBS) | SSR per request | Near RT | 3/5 |
| Fear & Greed US | Computed (Yahoo) | SSR per request | Delayed | 3/5 |
| Fear & Greed Crypto | Alternative.me | No cache | Daily | 4/5 |
| News | RSS / mock | 60s default | Variable | 2/5 |

Cache implementation: in-memory `Map` in `lib/providers/cache.ts` (per serverless instance).

---

## Vietnam Core Market Audit

| Field | Source | Notes |
|-------|--------|-------|
| Price | VPS `lastPrice` / `avePrice` | KBS `FMP`/`CP` on fallback |
| Reference price | VPS `r` or `closePrice` | Used for signed change % |
| Change % | Computed from price vs reference | Fixes VPS magnitude-only `changePc` |
| Volume | VPS `lot` × 10 shares | `VPS_VOLUME_UNIT` = lot10 |
| Trading value | `price × volume` or VPS-derived | GTGD proxy when value missing |
| Market cap | Seed file (`vietnam-heatmap-seeds`) | Static weights for treemap |
| Sector | Seed + `symbol-sectors` lookup | Not live from exchange |
| Exchange | HOSE / HNX / UPCOM from adapter grouping | `groupStocksByExchange` |
| Aggregation | All three boards merged | `hose + hnx + upcom` in analytics |

**Production observation:** VPS typically returns ~178 stocks (HOSE ~122, HNX ~36, UPCOM ~20) merged with seed universe for heatmap padding.

---

## Foreign Flow Audit

| Metric | Source | Real or Derived |
|--------|--------|-----------------|
| Foreign buy volume | VPS `fBVol` × 10 shares | **Real** (exchange feed via VPS) |
| Foreign sell volume | VPS `fSVolume` × 10 shares | **Real** |
| Foreign buy/sell value | shares × price | **Derived** |
| Net buy / net sell totals | Summed across all symbols | **Derived** |
| Top net buy / sell | Sorted per-symbol net | **Derived** |
| 7D / 30D views | Daily volume × period multiplier | **Extrapolated** (not historical) |
| HSX+HNX+UPCOM | Aggregated in `foreignRowsFromHeatmapStocks` | Yes |

KBS provides separate top-foreign leaderboards when VPS rows lack foreign fields.

---

## Proprietary Flow Audit

| Item | Detail |
|------|--------|
| Source | CafeF GH3 EOD (`GDTuDoanh.ashx`) |
| Storage | `ProprietaryTradingDaily` (Prisma/PostgreSQL) |
| Sync schedule | Vercel cron weekdays 17:30 ICT |
| `lastUpdatedAt` | Latest session date in DB or CafeF scrape |
| `coverageCount` | Symbols with non-zero buy/sell in overlay |
| Stale detection | `latestSessionDate !== today` → `isStale: true`, source `gtgd-proxy` |
| GTGD proxy fallback | When no EOD data: heatmap proprietary mode lacks per-symbol proprietary fields |
| Production mode | **Real CafeF EOD** when sync succeeded today; otherwise stale/proxy |

---

## Fear & Greed Inputs

| Gauge | Inputs | Provider |
|-------|--------|----------|
| Vietnam | Momentum (VNINDEX/KBS bars), breadth, liquidity, sector participation, foreign flow, volatility | Computed from VPS/KBS analytics |
| US | US heatmap change distribution | Yahoo-backed heatmap |
| Crypto | Alternative.me FNG index | `api.alternative.me` |

Weights: `lib/fear-greed/vietnam.ts` — momentum 20%, breadth 20%, liquidity 15%, sector 15%, foreign 15%, volatility 15%.

---

## US Data Audit

| Item | Detail |
|------|--------|
| Heatmap universe | `config/heatmap-symbols` seeds (~500 symbols) |
| Live quotes | Yahoo chart API per symbol (batched) |
| Minimum live threshold | 5 prices to mark `source: live` |
| Fields | price, changePercent, sector (from seed), marketCap (seed) |
| Timing | Unofficial Yahoo — typically delayed |

---

## Crypto Data Audit

| Item | Detail |
|------|--------|
| Provider | CoinGecko markets endpoint |
| Coverage | Top 50 by market cap |
| Fields | price, 24h %, market cap, volume |
| Heatmap | Same provider via `fetchCryptoRows` |

---

## Global Macro Audit

| Instrument | Yahoo | Stooq | Category |
|------------|-------|-------|----------|
| S&P 500 | ^GSPC | ^spx | indices |
| NASDAQ | ^IXIC | ^ndq | indices |
| Dow Jones | ^DJI | ^dji | indices |
| Gold | GC=F | xauusd.us | commodities |
| WTI Oil | CL=F | cl.f | commodities |
| DXY | DX-Y.NYB | dxy.us | forex |
| Silver | SI=F | xagusd.us | commodities |

Chain: Yahoo v8 → Yahoo v7 → Stooq → merged → mock.

---

## Weaknesses

1. **In-memory cache** — Cold starts and multi-instance inconsistency on Vercel.
2. **Market cap / sectors** — Seed-based for VN/US treemap weights, not live fundamentals.
3. **Foreign flow history** — 7D/30D are extrapolations, not true time series.
4. **Proprietary timing** — EOD only; intraday proprietary unavailable.
5. **Yahoo unofficial API** — Rate limits and breakage risk; US data delayed.
6. **Stubs** — FireAnt and Vietstock adapters not connected.
7. **Economic calendar** — Depends on free/scraped sources; mock fallback common.
8. **No unified observability** — Until this audit, no single health endpoint.

---

## Paid API Upgrade Path (when ready)

### Phase 1 — Harden US (optional)
- **Polygon.io** or **Finnhub** for US equities realtime
- Replace Yahoo in `lib/market/heatmap.ts` US path only
- Estimated need: when US delay unacceptable for product positioning

### Phase 2 — Vietnam institutional feed (optional)
- **Vietstock DataFeed** or **FireAnt** for licensed VN quotes + foreign/proprietary
- Wire existing stubs in `vietstock-adapter.ts` / `fireant-adapter.ts`
- Estimated need: when VPS/KBS reliability drops or foreign flow must be exchange-official

### Phase 3 — Realtime WebSocket (optional)
- **Twelve Data** already scaffolded (`lib/twelvedata/`, SSE relay)
- Enable for ticker bar / selected symbols only to control cost

### Phase 4 — Calendar SLA
- Paid **Trading Economics** key for `economic-provider.ts` primary path

**Current recommendation:** Stay on free stack. Monitor `/api/data-health` daily; buy when `sourceStatus` is `mock`/`unavailable` &gt;10% of sessions or business requires realtime US.

---

## Health Endpoint

```
GET /api/data-health
```

Returns JSON:

```json
{
  "generatedAt": "ISO-8601",
  "vietnam": { "provider", "lastUpdatedAt", "cacheTtlMs", "itemCount", "coverageCount", "sourceStatus", "warnings", "details" },
  "foreignFlow": { ... },
  "proprietaryFlow": { ... },
  "us": { ... },
  "crypto": { ... },
  "global": { ... }
}
```

`sourceStatus` values: `live`, `mock`, `partial`, `stale`, `eod`, `unavailable`, `cache`.

---

## Related Files

| Purpose | Path |
|---------|------|
| Cache TTLs | `lib/providers/cache.ts` |
| Vietnam orchestration | `lib/providers/vietnam-market-provider.ts` |
| Adapter registry | `lib/adapters/vietnam/registry.ts` |
| Foreign flow math | `lib/vietnam/foreign-flow.ts`, `lib/vietnam/market-analytics.ts` |
| Proprietary overlay | `lib/proprietary/heatmap-overlay.ts` |
| Health builder | `lib/data-health/build-health-report.ts` |
| Health route | `app/api/data-health/route.ts` |
| Existing service probe | `app/api/health/route.ts` |

---

## Validation

```bash
npm run build
curl http://localhost:3000/api/data-health
```

Compare `sourceStatus` and `warnings` against production logs (`[heatmap:vn]`, `[proprietary:heatmap]`).
