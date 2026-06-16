# Sprint 6 — Revised Provider Strategy

Date: 2026-06-16  
Status: **Approved** (Alpha Vantage migration **rejected**)

---

## Decision summary

| Decision | Outcome |
|----------|---------|
| Alpha Vantage as primary FX | **Rejected** — free tier cannot sustain 28-pair currency strength |
| Twelve Data as primary FX | **Restored** via `lib/forex/pairs-provider.ts` |
| Provider abstraction | **Kept** — `lib/forex/pairs-provider.ts` decouples consumers from TD |
| Alpha Vantage code | **Retained** at `lib/alphavantage/` (reference only, not routed) |
| Deploy Alpha Vantage | **Do not deploy** |

---

## Final provider architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                     MarketWall Dashboard                         │
│  Ticker │ Overview │ Currency Strength │ Heatmap │ News │ Cal   │
└────────────┬────────────────────────────────────────────────────┘
             │
    ┌────────┴────────┐
    │  REST APIs +    │
    │  SSE realtime   │
    └────────┬────────┘
             │
┌────────────┴────────────────────────────────────────────────────┐
│                    Server-side providers                         │
├──────────────┬──────────────┬──────────────┬────────────────────┤
│ Twelve Data  │  CoinGecko   │ TCBS / VN    │ Finnhub + RSS      │
│ (paid key)   │  (free)      │ (free public)│ (free key)         │
├──────────────┼──────────────┼──────────────┼────────────────────┤
│ • FX 28-pair │ • Crypto top │ • VN indices │ • Breaking news    │
│ • Overview   │   50 markets │ • VN100 tiles│ • Headlines        │
│ • US 100     │ • Fear&Greed │ • HOSE/HNX   │ • Calendar (target)│
│   heatmap    │   overlay    │   seeds      │                    │
│ • WS relay   │              │              │ Trading Economics  │
│ • Symbol     │              │              │ (calendar current) │
│   detail     │              │              │                    │
└──────────────┴──────────────┴──────────────┴────────────────────┘
             │
    ┌────────┴────────┐
    │ In-memory cache │  forex 60s │ overview 30s │ heatmap 3m
    └─────────────────┘
```

### Routing table

| Feature | Primary provider | Module | Fallback |
|---------|------------------|--------|----------|
| **Currency Strength** | Twelve Data | `lib/forex/pairs-provider.ts` → `lib/twelvedata/client.ts` | `unavailable` (no mock blend) |
| **Ticker / Overview** | Twelve Data | `lib/market/overview.ts` | Per-symbol mock merge |
| **US Heatmap (100)** | Twelve Data batch quotes | `lib/market/heatmap.ts` | `lib/mockHeatmapData.ts` (7 symbols) |
| **VN Heatmap (100)** | TCBS adapter | `lib/adapters/vietnam/tcbs-adapter.ts` | Vietnam mock seeds |
| **Crypto Heatmap (50)** | CoinGecko | `lib/providers/crypto-provider.ts` | Crypto mock defs |
| **Realtime ticks** | Twelve Data WebSocket | `lib/twelvedata/ws-relay.ts` | REST + SWR |
| **News** | Finnhub | `lib/api/finnhub.ts` | RSS → mock |
| **Calendar** | Trading Economics | `lib/providers/economic-provider.ts` | Mock events |
| **Calendar (target)** | Finnhub | Planned Sprint 7 | — |

### Abstraction layer (kept)

| Layer | Purpose |
|-------|---------|
| `lib/forex/pairs-provider.ts` | Single entry for FX pair quotes; consumers never import TD directly |
| `lib/forex/types.ts` | Shared `FxPairQuote` type |
| `lib/providers/cache.ts` | TTL cache reduces API overuse |
| `lib/providers/fallback.ts` | `withFallback()` pattern for non-strength widgets |

---

## Why Alpha Vantage was rejected

| Constraint | Alpha Vantage free | MarketWall need |
|------------|-------------------|-----------------|
| Rate limit | **5 calls / minute** | 28 pairs = 28 calls per full refresh |
| Daily cap | **500 calls / day** | ~17 full strength refreshes/day max |
| Batch API | None for FX_DAILY | 1 TD batch call covers 28 pairs |
| Cold-start latency | ~7s sequential + throttling | Unacceptable for `/api/currency-strength` |
| Production SLA | Rate-limit messages common | "Currency strength unavailable" |

**Conclusion:** Alpha Vantage is viable for demos (1–3 pairs), not for a 28-pair live dashboard on free tier. A paid AV plan ($49+/mo) still loses to Twelve Data batch efficiency for FX.

---

## API cost analysis

### Twelve Data (primary paid provider)

| Plan (indicative) | Credits/month | Est. MarketWall usage | Fit |
|-------------------|---------------|----------------------|-----|
| Free / Basic | 800/day | Borderline with cache | Dev only |
| Grow | 8,000+/day | Comfortable | **Recommended min** |
| Pro | 55,000+/day + WebSocket | Full realtime | Production target |

**Credit model:** ~1 credit per symbol per REST quote; batch `/quote` counts per symbol in batch.

### CoinGecko (free)

| Tier | Limit | MarketWall usage | Fit |
|------|-------|------------------|-----|
| Demo | 10–30 calls/min | 1 call / 45s cache ≈ 1.3/min | ✅ Sustainable |
| Analyst | Higher | Headroom for growth | Optional upgrade |

### TCBS (free public)

| Cost | Limit | Usage | Fit |
|------|-------|-------|-----|
| $0 | Undocumented fair-use | ~20 parallel overview calls / 3m cache | ✅ Sustainable |
| Risk | API changes / blocking | Adapter + mock fallback | Monitor |

### Finnhub (free)

| Tier | Limit | Usage | Fit |
|------|-------|-------|-----|
| Free | 60 calls/min | News: few calls/hour with cache | ✅ Sustainable |
| Free | 60 calls/min | Calendar migration: ~1 call/min max | ✅ OK with cache |

### Trading Economics (current calendar)

| Tier | Limit | Usage | Fit |
|------|-------|-------|-----|
| Paid key | Plan-dependent | Calendar fetch cached | Keep until Finnhub calendar |

---

## Daily request estimates (production)

Assumptions: **btrading.org**, server-side cache, moderate traffic (~500 dashboard loads/day), Vercel warm instances.

| Endpoint / provider | Cache TTL | Calls per refresh | Est. refreshes/day | Est. API calls/day |
|---------------------|-----------|-------------------|--------------------|--------------------|
| Currency strength (TD, 28-pair batch) | 60s | 1 batch (28 credits) | ~200 (shared cache) | **~200 batches ≈ 5,600 credits** |
| Overview / ticker (TD, ~10 symbols) | 30s | 1 batch (~10 credits) | ~400 | **~4,000 credits** |
| US heatmap (TD, 100 symbols) | 3m | 2 batches (50+50) | ~80 | **~16,000 credits** |
| Realtime WS (TD) | persistent | 1 connection | 1 | **WS plan credits** |
| Symbol detail (TD) | 30s | 2 (quote + series) | ~50 | **~100 credits** |
| Crypto (CoinGecko) | 45s | 1 markets call | ~200 | **~200 calls** |
| Vietnam (TCBS) | 3m | ~22 overview calls | ~80 | **~1,760 HTTP calls** |
| News (Finnhub) | 60s | 1 | ~100 | **~100 calls** |
| Calendar (TE) | 60s | 1 | ~50 | **~50 calls** |

### Twelve Data total (estimated)

| Scenario | Daily credits | Monthly (~30d) |
|----------|---------------|----------------|
| **Low traffic** (cache hits, 200 users) | ~8,000–12,000 | ~240k–360k |
| **Moderate** (table above) | ~25,000–30,000 | ~750k–900k |
| **High** (cache cold, bots, no WS) | ~50,000+ | ~1.5M+ |

**Largest consumer:** US heatmap (100 symbols × 2 batches × frequent invalidation). Optimize by extending heatmap TTL to 5m if credits tight.

---

## Free tier sustainability

| Provider | Free tier viable for MarketWall? | Notes |
|----------|----------------------------------|-------|
| **Alpha Vantage** | ❌ **No** | 28-pair FX unsustainable (500/day cap) |
| **CoinGecko** | ✅ **Yes** | 45s cache; single markets endpoint |
| **TCBS** | ✅ **Yes** | Public API; fair-use risk only |
| **Finnhub** | ✅ **Yes** | News + future calendar with cache |
| **RSS** | ✅ **Yes** | Unlimited; backup news source |
| **Twelve Data** | ⚠️ **Partial** | Free 800/day insufficient for US100+FX+overview; **paid plan required** |
| **Trading Economics** | ❌ **No** (free) | Paid key assumed for calendar |

### Recommended production stack

1. **Twelve Data Grow+** — FX, overview, US heatmap, optional WS  
2. **CoinGecko Demo** — crypto (upgrade if rate-limited)  
3. **TCBS public** — Vietnam  
4. **Finnhub free** — news; migrate calendar in Sprint 7  
5. **No Alpha Vantage** in production  

---

## Code changes (Sprint 6 revised)

| File | Change |
|------|--------|
| `lib/forex/pairs-provider.ts` | Twelve Data primary only |
| `lib/api/alphaVantage.ts` | Marked `@deprecated` |
| `lib/alphavantage/*` | Retained, not routed |
| `.env.example` | Removed `ALPHA_VANTAGE_API_KEY` |
| `SPRINT6_DATA_PROVIDER_MIGRATION.md` | Marked rejected / superseded |

API contracts and UI: **unchanged**.

---

## Sprint 7 roadmap (provider optimization)

1. **Reduce TD credits** — extend US heatmap cache to 5m; lazy-load heatmap tabs  
2. **Finnhub calendar** — replace Trading Economics  
3. **VNStock adapter** — expand VN100 live coverage beyond TCBS seeds  
4. **Polling realtime** — reduce WS dependency for serverless  
5. **Evaluate TD plan tier** — align credits with daily estimate table  

---

## Production checklist

- [x] Twelve Data restored as FX primary (`pairs-provider`)  
- [ ] `TWELVE_DATA_API_KEY` set on Vercel (required for currency strength + US heatmap)  
- [ ] Monitor TD credit usage in Twelve Data dashboard  
- [ ] Do **not** set `ALPHA_VANTAGE_API_KEY` on production  
- [ ] Verify `/api/currency-strength` returns 8 currencies when TD key present  

---

## Build result

```bash
npm run build  # expected: pass after revert
```
