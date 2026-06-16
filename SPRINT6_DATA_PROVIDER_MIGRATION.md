# Sprint 6 — Free Data Provider Migration Audit

> **Status: REJECTED** — Alpha Vantage free tier is not suitable for production.  
> **Superseded by:** [`SPRINT6_REVISED_PROVIDER_STRATEGY.md`](SPRINT6_REVISED_PROVIDER_STRATEGY.md)  
> FX primary restored to Twelve Data via `lib/forex/pairs-provider.ts`.

Date: 2026-06-16  
Scope: Reduce Twelve Data dependency; migrate to free/low-cost providers where possible.  
**Sprint 6 implemented:** Currency Strength → Alpha Vantage (primary).

---

## Executive summary

| Domain | Target provider | Sprint 6 status |
|--------|-----------------|-----------------|
| **Currency Strength (FX)** | Alpha Vantage | ✅ **Replaced** (primary) |
| **Crypto** | CoinGecko | ✅ Already live-first |
| **Vietnam markets** | TCBS / VNStock adapters | ✅ TCBS active; VNStock planned |
| **News** | Finnhub + RSS | ✅ Already live-first |
| **Economic calendar** | Finnhub | 🔄 Partial (Trading Economics also used) |
| **Overview / ticker** | Twelve Data | ⏳ Keep temporarily |
| **US heatmap** | Twelve Data | ⏳ Keep temporarily |
| **Realtime SSE/WS** | Twelve Data WebSocket | ⏳ Keep temporarily |
| **Symbol detail** | Twelve Data | ⏳ Keep temporarily |

---

## Twelve Data usage audit

### Classified inventory

| # | File / endpoint | Function | Classification | Sprint 6 action |
|---|-----------------|----------|----------------|-----------------|
| 1 | `lib/market/currency-strength.ts` | 28-pair FX fetch | **Replace** | ✅ Uses `lib/forex/pairs-provider.ts` → Alpha Vantage |
| 2 | `app/api/currency-strength/route.ts` | Currency strength API | **Replace** | ✅ Indirect via `fetchLiveCurrencyStrength` |
| 3 | `app/api/realtime/stream/route.ts` | Seed FX pair baselines | **Replace** | ✅ Uses `pairs-provider` for REST seed |
| 4 | `lib/providers/currency-provider.ts` | Legacy provider path | **Replace** | ✅ Comment updated; uses market layer |
| 5 | `lib/api/twelveData.ts` | Deprecated shim | **Remove** (later) | Keep until overview migrated |
| 6 | `lib/api/currencyStrength.ts` | Re-export shim | **Keep** | Routes to market layer |
| 7 | `lib/market/overview.ts` | `getOverviewQuotes()` | **Keep temporarily** | Gold, FX, indices, crypto overview |
| 8 | `lib/market/heatmap.ts` | `getStockQuotes()` US 100 | **Keep temporarily** | Needs free US equity source |
| 9 | `app/api/markets/overview/route.ts` | Dashboard ticker/overview | **Keep temporarily** | Depends on overview.ts |
| 10 | `app/api/markets/[symbol]/route.ts` | Symbol detail + time series | **Keep temporarily** | Needs replacement OHLCV source |
| 11 | `lib/twelvedata/client.ts` | Core TD REST client | **Keep temporarily** | Fallback for FX if AV empty |
| 12 | `lib/twelvedata/ws-relay.ts` | WebSocket relay | **Keep temporarily** | No free WS equivalent yet |
| 13 | `app/api/realtime/stream/route.ts` | Overview WS seed | **Keep temporarily** | Still uses TD overview quotes |
| 14 | `lib/market/normalize.ts` | TD response types | **Keep temporarily** | Shared normalizers |
| 15 | `config/market-symbols.ts` | Symbol registry (TD apiSymbol) | **Refactor** (later) | Neutral naming in Sprint 7 |

### APIs that can be deleted (after full migration)

| API / module | When safe to delete |
|--------------|---------------------|
| `lib/api/twelveData.ts` | After overview + symbol detail off TD |
| `lib/twelvedata/ws-relay.ts` | After polling/SSE-only realtime or free WS |
| `lib/twelvedata/client.ts` | After all consumers migrated |
| `TWELVE_DATA_API_KEY` env | After production cutover verified |

**Do not delete yet** — US heatmap, overview, and realtime still depend on Twelve Data.

---

## Currency Strength — Alpha Vantage migration

### Formula (unchanged — 28-pair model)

1. Fetch **1D % change** per pair (BASE/QUOTE).
2. BASE `+= pairChange`, QUOTE `-= pairChange`.
3. Average by appearances per currency.
4. Zero-mean normalize → `score = clamp(50 + normalized, 0, 100)`.
5. Currencies: **USD, EUR, GBP, JPY, AUD, NZD, CAD, CHF** only (no VND).

### Data source change

| Before (Sprint 5) | After (Sprint 6) |
|-------------------|------------------|
| `lib/twelvedata/client.ts` → `getForexPairsForCurrencyStrength()` | `lib/alphavantage/client.ts` → `FX_DAILY` (last 2 closes → 1D %) |
| Batch `/quote` (28 pairs) | Sequential `FX_DAILY` per pair with 250ms delay |
| `TWELVE_DATA_API_KEY` required | `ALPHA_VANTAGE_API_KEY` primary |

### Provider routing (`lib/forex/pairs-provider.ts`)

```
1. If ALPHA_VANTAGE_API_KEY → Alpha Vantage (cached 60s)
2. Else if TWELVE_DATA_API_KEY → Twelve Data (temporary fallback)
3. Else → [] → API returns unavailable
```

### API contract (unchanged)

`GET /api/currency-strength` response shape:

```json
{
  "source": "live" | "mock",
  "items": [{ "currency", "strength", "change", "label" }],
  "unavailable": boolean
}
```

### Env

```env
ALPHA_VANTAGE_API_KEY=your_key_here
```

Add to Vercel production alongside existing keys.

---

## Other providers (already free-first)

### Vietnam — TCBS / VCI

| Component | Provider | Notes |
|-----------|----------|-------|
| `lib/adapters/vietnam/tcbs-adapter.ts` | TCBS public API | No key; priority 1 |
| `lib/providers/vietnam-market-provider.ts` | TCBS + mock seeds | VN100 expansion in Sprint 5 |
| VNStock adapter | **Planned** | Not wired yet |

### Crypto — CoinGecko

| Component | Provider |
|-----------|----------|
| `lib/providers/crypto-provider.ts` | CoinGecko `/coins/markets` |
| `lib/market/heatmap.ts` crypto path | CoinGecko live-first |

### News — Finnhub + RSS

| Component | Provider |
|-----------|----------|
| `lib/providers/news-provider.ts` | Finnhub → RSS fallback |
| `lib/api/finnhub.ts` | `FINNHUB_API_KEY` |

### Economic calendar — Finnhub (target) / Trading Economics (current)

| Component | Provider |
|-----------|----------|
| `lib/providers/economic-provider.ts` | Trading Economics + mock |
| **Sprint 7 target** | Finnhub economic calendar API |

---

## Realtime / polling

| Layer | Implementation | Provider |
|-------|----------------|----------|
| SSE `/api/realtime/stream` | Twelve Data WS relay | TD (temporary) |
| FX REST seed | `pairs-provider` | **Alpha Vantage** (Sprint 6) |
| Overview REST seed | `getOverviewQuotes` | Twelve Data (temporary) |
| Client fallback | SWR → REST APIs | Mixed |

**Sprint 7:** Replace TD WS with REST polling (Alpha Vantage + CoinGecko + TCBS) for serverless-friendly realtime.

---

## Remaining blockers

| Blocker | Impact | Mitigation |
|---------|--------|------------|
| Alpha Vantage free tier: **5 calls/min, 500/day** | 28 pairs ≈ 7s + rate limits | 60s server cache; upgrade key for prod |
| No free US equity batch API | US heatmap stuck on TD or mock | Yahoo Finance / Finnhub stocks (Sprint 7) |
| No free global index API (SPX, IXIC) | Overview indices on TD | Finnhub / AV global quote (Sprint 7) |
| TD WebSocket requires Pro+ | Realtime may fallback REST | Document; polling fallback Sprint 7 |
| VNStock not integrated | VN relies on TCBS + seeds | Wire VNStock adapter Sprint 7 |

---

## Files changed (Sprint 6)

| File | Change |
|------|--------|
| `lib/forex/types.ts` | **New** — shared `FxPairQuote` |
| `lib/forex/pairs-provider.ts` | **New** — AV primary, TD fallback |
| `lib/alphavantage/client.ts` | **New** — `FX_DAILY` pair fetch + cache |
| `lib/alphavantage/types.ts` | **New** — AV response types |
| `lib/api/alphaVantage.ts` | **New** — public API shim |
| `lib/market/currency-strength.ts` | Import `pairs-provider` |
| `app/api/realtime/stream/route.ts` | FX seed via `pairs-provider` |
| `lib/twelvedata/types.ts` | Re-export `FxPairQuote` from forex |
| `lib/providers/cache.ts` | `forexAlphaVantage` cache key |
| `lib/providers/currency-provider.ts` | Doc update |
| `.env.example` | `ALPHA_VANTAGE_API_KEY` |

---

## Migration plan (Sprint 7+)

1. **Overview/ticker** — Finnhub quote + CoinGecko crypto + TCBS VN indices; remove TD from `overview.ts`.
2. **US heatmap** — Finnhub or AV `TIME_SERIES_DAILY` batch; remove `getStockQuotes`.
3. **Realtime** — Polling SSE refresh every 30–60s from free providers; deprecate `ws-relay.ts`.
4. **Symbol detail** — Provider per asset class; delete `app/api/markets/[symbol]` TD path or multi-source resolver.
5. **Calendar** — Finnhub economic calendar only; remove Trading Economics dependency.
6. **VNStock** — Primary adapter for VN100; TCBS fallback.

---

## Build result

Run after Sprint 6 changes:

```bash
npm run build
```

Expected: pass with `/api/currency-strength` and `/api/realtime/stream` unchanged routes.

---

## Production checklist

- [ ] Set `ALPHA_VANTAGE_API_KEY` on Vercel (`marketwall` project)
- [ ] Verify `GET /api/currency-strength` returns 8 currencies with `unavailable: false`
- [ ] Monitor AV rate limits; consider premium key if cold-cache fetches fail
- [ ] Keep `TWELVE_DATA_API_KEY` until overview/heatmap migrated (fallback only for FX)
