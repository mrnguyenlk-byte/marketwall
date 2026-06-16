# Sprint 8 — Provider Failure Audit

**Date:** 2026-06-16  
**Production:** https://btrading.org  
**Sprint 7 deploy:** `41cb7d3` (soft coverage + heatmap metadata)  
**Scope:** Diagnose why production returns `source=mock` and currency strength `unavailable=true`  
**Constraints:** No UI changes · No new providers · Diagnostic logging only

---

## Executive Summary

| Endpoint | Observed | Root cause | Failing provider |
|----------|----------|------------|------------------|
| `/api/currency-strength` | `items=[]`, `unavailable=true`, `pairCount=0` | Twelve Data daily credits exhausted (HTTP 429) | **Twelve Data** |
| `/api/heatmaps/us` | `source=mock`, `itemCount=100`, `livePriceCount=0` | Twelve Data returns 0 stock quotes; US seeds use `price=0` until overlay | **Twelve Data** (+ labeling gate) |
| `/api/heatmaps/vietnam` | `source=mock`, `itemCount=100`, `livePriceCount=100` | Vietnam adapter chain fails; API labels `mock` because upstream `source≠live` | **TCBS** (404) |
| `/api/health` → `vietnamMarkets` | `source=mock`, `fallback=true` | Same TCBS failure → `withFallback()` | **TCBS** |

**Not the cause:** Missing `TWELVE_DATA_API_KEY` on production (currency-strength returns `source:"live"`, not mock).  
**Not the cause:** Sprint 7 coverage gate regression (`pairCount=0` — provider returned zero pairs before any gate runs).

---

## Production Evidence (2026-06-16)

### `/api/currency-strength`

```json
{
  "source": "live",
  "items": [],
  "unavailable": true,
  "pairCount": 0,
  "coverage": "unavailable",
  "fallback": false
}
```

**Interpretation:** Live code path executed (`source: live`). Forex provider returned **0 pairs**. Sprint 7 soft gate correctly marks `coverage: unavailable` when `pairCount < 8`.

### `/api/heatmaps/us`

```json
{
  "source": "mock",
  "itemCount": 100,
  "livePriceCount": 0,
  "seedCount": 100,
  "unavailable": false
}
```

**Interpretation:** 100 tiles returned (Sprint 5/7 seed universe OK). `livePriceCount=0` because Twelve Data overlay failed. `source=mock` is a **metadata label**, not a swap to 7-symbol mock data.

### `/api/heatmaps/vietnam`

```json
{
  "source": "mock",
  "itemCount": 100,
  "livePriceCount": 100,
  "seedCount": 100,
  "unavailable": false
}
```

**Interpretation:** All 100 VN seed tiles have prices (mock seeds). `source=mock` because `vietnam-market-provider` upstream returned `source: mock` (TCBS failed), not because tile count is low.

### `/api/health`

```json
{
  "vietnamMarkets": { "ok": false, "source": "mock", "fallback": true },
  "globalMarkets": { "ok": true, "source": "live", "fallback": false },
  "crypto": { "ok": true, "source": "live", "fallback": false }
}
```

**Interpretation:** Non–Twelve Data providers (CoinGecko, Yahoo/Stooq chain) still work. Failures are isolated to **Twelve Data** and **TCBS**.

---

## Root Cause Analysis

### 1. Currency strength — `unavailable=true`

| Check | Result |
|-------|--------|
| API key missing? | **No** — production shows `source: live` |
| Rate limit? | **Yes** — Twelve Data returns `code: 429` |
| Parsing failure? | **No** — request fails before parse |
| Provider timeout? | **No** — immediate 429 JSON error body |
| Fallback trigger bug? | **No** — `pairCount=0` is correct when TD returns zero quotes |

**Call chain:**

```
GET /api/currency-strength
  → fetchLiveCurrencyStrength()
  → getForexPairsForCurrencyStrength()
  → getTwelveDataForexPairs()
  → getQuotes() batched /quote (8 symbols/batch)
  → fetchQuoteBatch() → tdFetch() → 429 error
  → rateLimited=true, quotes=[], loop breaks on first empty batch
  → pairCount=0 → coverage=unavailable
```

**Local reproduction (same API key as Vercel):**

```
GET https://api.twelvedata.com/quote?symbol=EUR/USD&apikey=***
→ { "status": "error", "code": 429,
    "message": "You have run out of API credits for the day. 10458 API credits were used, with the current limit being 800. ..." }
```

### 2. US heatmap — `source=mock`

| Check | Result |
|-------|--------|
| API key missing? | **No** |
| Rate limit? | **Yes** — `getStockQuotes()` returns `[]` |
| Parsing failure? | **No** |
| Provider timeout? | **No** |
| Fallback trigger bug? | **Partial** — labeling gate, not data swap |

**Why `livePriceCount=0`:** `seedsToRows()` initializes US seeds with `price: 0`. When Twelve Data fails, no overlay → `countLivePrices() === 0`.

**Why `source=mock`:** `livePriceCount < US_LIVE_MIN_PRICES` (5) forces label `mock` even with 100 seed symbols.

### 3. Vietnam heatmap — `source=mock`

| Check | Result |
|-------|--------|
| API key missing? | **N/A** — TCBS is public |
| Rate limit? | **No** |
| Parsing failure? | **No** — HTTP 404 before parse |
| Provider timeout? | **No** |
| Fallback trigger bug? | **Yes (labeling)** — 100 priced seed tiles but `source=mock` because upstream failed |

**TCBS reproduction:**

```
GET https://apipubaws.tcbs.com.vn/quote/v1/ticker/VCB/overview
→ HTTP 404 { "status": 404, "message": "Service not found" }
```

**Adapter chain:** tcbs (error) → vietstock (not_configured) → fireant (not_configured) → `withFallback()` → mock.

---

## Failure Classification Matrix

| Symptom | API key | Rate limit | Parsing | Timeout | Fallback bug |
|---------|---------|------------|---------|---------|--------------|
| Currency `pairCount=0` | ❌ | ✅ **429** | ❌ | ❌ | ❌ |
| US `livePriceCount=0` | ❌ | ✅ **429** | ❌ | ❌ | ⚠️ label only |
| VN `source=mock` | ❌ | ❌ | ❌ | ❌ | ⚠️ label + TCBS 404 |
| VN tiles = 100 | — | — | — | — | ✅ data OK |

---

## Failing Providers

### Twelve Data

- **Env:** `TWELVE_DATA_API_KEY` present
- **Failure:** ~10,458 credits used vs **800/day** free limit
- **Error:** `{ code: 429, message: "You have run out of API credits..." }`
- **Affected:** Currency strength, US heatmap overlay, overview, realtime relay

### TCBS `apipubaws`

- **Env:** No key; adapter enabled by default
- **Failure:** HTTP **404 Service not found** on `/quote/v1/ticker/{ticker}/overview`
- **Affected:** Vietnam markets, VN heatmap live label

---

## Production Logs (after Sprint 8 deploy)

```
[provider:forex-pairs] keyConfigured=true pairCount=0 reason=twelvedata_returned_zero_pairs
[provider:twelvedata] context=fetchQuoteBatch code=429 batch=8 symbols=EUR/USD,... message=You have run out of API credits...
[currency-strength] unavailable pairCount=0 reason=twelvedata_zero_pairs

[provider:twelvedata] context=fetchQuoteBatch code=429 batch=25 symbols=AAPL,MSFT,...
[heatmap:us] items=100 livePrices=0 source=mock reason=twelvedata_zero_live_prices

[provider:vietnam:tcbs] ticker=VCB http=404 body={"status":404,"message":"Service not found"}
[provider:vietnam:tcbs] status=error message=TCBS returned no market data
[provider:vietnam-markets] adapters_failed status=error message=TCBS returned no market data
[provider:fallback] provider=vietnam-markets reason=primary_returned_null
[heatmap:vn] items=100 livePrices=100 upstream=mock source=mock reason=vietnam_provider_mock
```

---

## Exact Reasons

**US `source=mock`:** Twelve Data 429 → zero stock quotes → US seeds stay at `price=0` → `livePriceCount=0` → mock label. Not the 7-symbol mock universe.

**VN `source=mock`:** TCBS 404 → adapter chain fails → mock seeds served (100 priced tiles) → heatmap propagates upstream mock label.

**Currency `unavailable=true`:** Twelve Data 429 → zero FX pairs → `pairCount=0` < degraded threshold (8).

---

## Fix Plan

### P0 — Twelve Data credits

- Wait for daily reset or upgrade plan / rotate key
- Increase cache TTLs to reduce batch burn
- Sprint 8 logging for visibility ✅

### P1 — US heatmap labeling

- Option: seed reference prices (like VN) when TD down
- Option: split `dataSource` vs `quoteSource` in API metadata

### P2 — TCBS 404

- Verify current TCBS public API path (endpoint may have moved)
- Test geo/block from Vercel US region
- Document seed-only VN display until Vietstock/Fireant credentials

---

## Files Changed (Sprint 8)

| File | Change |
|------|--------|
| `lib/providers/provider-diagnostics.ts` | New shared log helpers |
| `lib/twelvedata/client.ts` | TD error + batch logging |
| `lib/forex/pairs-provider.ts` | Key + pair count logging |
| `lib/providers/fallback.ts` | Fallback reason logging |
| `lib/adapters/vietnam/registry.ts` | Per-adapter status logging |
| `lib/adapters/vietnam/tcbs-adapter.ts` | HTTP status per ticker |
| `lib/providers/vietnam-market-provider.ts` | Adapter chain failure log |
| `lib/market/heatmap.ts` | `reason=` on source decision |
| `lib/market/currency-strength.ts` | Unavailable reason log |

**Build:** `npm run build` ✅

---

## Production Verification Checklist

```bash
curl -s https://btrading.org/api/currency-strength | jq '{pairCount,coverage,unavailable,items:(.items|length)}'
curl -s https://btrading.org/api/heatmaps/us | jq '{source,itemCount,livePriceCount}'
curl -s https://btrading.org/api/heatmaps/vietnam | jq '{source,itemCount,livePriceCount}'
curl -s https://btrading.org/api/health | jq '.services.vietnamMarkets'
```

**Pass:** `pairCount>=8`, US `livePriceCount>=5`, VN `source:live`, no recurring `429`/`404` in Vercel logs.
