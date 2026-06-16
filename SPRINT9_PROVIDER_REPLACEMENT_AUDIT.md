# Sprint 9 — Provider Replacement Audit

**Date:** 2026-06-16  
**Reason:** Twelve Data free tier exhausted (~10.4k credits vs 800/day) — unusable for production  
**Scope:** Remove Twelve Data from Currency Strength + US Heatmap; evaluate FX/US/VN alternatives  
**Build:** `npm run build` ✅

---

## Executive Summary

| Feature | Removed | Replacement | Status |
|---------|---------|-------------|--------|
| Currency Strength (28 FX pairs) | Twelve Data | **Yahoo Finance v8 chart** + **ECB** fallback | ✅ Implemented |
| US Heatmap (100 symbols) | Twelve Data `getStockQuotes` | **Yahoo Finance v8 chart** | ✅ Implemented |
| Vietnam heatmap overlay | TCBS (404) | **VPS datafeed** (`bgapidatafeed.vps.com.vn`) | ✅ Implemented |

**Recommendation:** Ship Yahoo + ECB for FX/US immediately. Use VPS as primary Vietnam adapter. Keep Twelve Data only for overview/realtime until a later sprint (out of Sprint 9 scope).

---

## Tested Providers

### FX / Currency Strength

| Provider | Endpoint | Test result | 28-pair coverage | Change % | Rate limit | Production suitability |
|----------|----------|-------------|------------------|----------|------------|------------------------|
| **Twelve Data** | `api.twelvedata.com/quote` | ❌ HTTP 429 credits exhausted | 0 (blocked) | Yes | 800 credits/day free | **Unusable** |
| **Yahoo Finance v8** | `query1.finance.yahoo.com/v8/finance/chart/{PAIR}=X` | ✅ 28/28 pairs | **28/28** | Yes (`regularMarketChangePercent`) | Unofficial; ~8 concurrent + 60ms gap | **Recommended primary** |
| **Yahoo Finance v7** | `query1.finance.yahoo.com/v7/finance/quote` | ❌ HTTP 401 | N/A | Yes | Blocked without session/crumb | Not suitable |
| **ECB** | `ecb.europa.eu/.../eurofxref-daily.xml` | ✅ HTTP 200 | **28/28 derivable** | No (daily snapshot, 0% change) | Daily publish; unlimited fetch | **Recommended fallback** |
| **Stooq** | `stooq.com/q/l/?s=eurusd.us,...` | ❌ HTTP 404 | 0 | Yes (OHLC) | Unknown | **Not suitable** (endpoint broken from test network) |

**Yahoo FX test (2026-06-16):** EURUSD=X, GBPUSD=X, USDJPY=X, EURGBP=X, … all returned `regularMarketPrice` — **28/28 OK** in ~7.6s sequential probe.

**ECB:** Parses daily EUR reference rates; derives crosses (e.g. GBP/USD = rate_USD / rate_GBP). Suitable when Yahoo throttles; strength `changePercent` will be 0 for ECB-only pairs.

### US Equities (Heatmap)

| Provider | Endpoint | Test result | 10-stock sample | Rate limit | Production suitability |
|----------|----------|-------------|-----------------|------------|------------------------|
| **Twelve Data** | `/quote` batch | ❌ 429 | 0/10 | 800/day | **Removed** |
| **Yahoo Finance v8** | `/v8/finance/chart/{SYMBOL}` | ✅ | **10/10** (AAPL, MSFT, NVDA, BRK-B, …) | Unofficial; 10 concurrent + 60ms gap | **Recommended** |
| **Stooq** | CSV bulk | ❌ 404 | 0/10 | N/A | Not suitable |

**Implementation:** `fetchYahooStockQuotes()` in `lib/providers/yahoo-finance.ts` — 100 US seeds, ~6–10s cold fetch, cached via existing heatmap TTL.

### Vietnam Market

| Provider | Endpoint | Test result | Auth | Rate limit | Production suitability |
|----------|----------|-------------|------|------------|------------------------|
| **TCBS** | `apipubaws.tcbs.com.vn/quote/v1/ticker/{t}/overview` | ❌ HTTP 404 | None | N/A | **Dead** — remove from priority |
| **FireAnt** | `restv2.fireant.vn`, `api.fireant.vn` | ❌ HTTP 404 | API key (stub) | N/A | Not connected |
| **VCI (Vietcap)** | `iq.vietcap.com.vn/...` | ❌ HTTP 403 | Unknown | Blocked | Not suitable without contract |
| **SSI iBoard** | `iboard-query.ssi.com.vn/stock/exchange/hose` | ✅ HTTP 200 | None | Public query API | **Good for bulk listings** (407 HOSE rows); indices/components |
| **VPS** | `bgapidatafeed.vps.com.vn/getliststockdata/{symbols}` | ✅ HTTP 200 | None | Batch comma-separated | **Recommended primary** — real-time quotes for VN100 seeds |
| **Entrade** | `services.entrade.com.vn/chart-api/...` | ✅ HTTP 200 | None | Historical OHLCV | Secondary — EOD/history, not ideal for heatmap ticks |
| **KBS** | `kbbuddywts.kbsec.com.vn/...` | ❌ HTML shell | N/A | N/A | Not suitable (returns SPA HTML) |
| **VNStock (lib)** | Python package aggregating KBS/VPS/VCI | N/A in Node | Varies | Package-level | Reference only — not a direct HTTP API |

**VPS test:** `VCB,FPT,HPG` batch → prices + `changePc` — matches live VND (`closePrice: 61600`).

**SSI test:** HOSE `MAIN` board → 407 symbols with `matchedPrice`, `priceChangePercent`.

---

## Replacement Recommendation

### Currency Strength

```
Primary:  Yahoo Finance v8  (lib/providers/yahoo-finance.ts)
Fallback: ECB daily XML     (lib/providers/ecb-fx.ts)
Router:   lib/forex/pairs-provider.ts
```

- Target: **28 pairs**, `coverage: ideal` after deploy
- No API key, no credit counter
- Risk: Yahoo unofficial API — mitigate with ECB fallback + server cache (existing 60s forex cache in TD client can be moved to pairs-provider in follow-up)

### US Heatmap

```
Primary: Yahoo Finance v8 batch (10-wide concurrency)
File:    lib/market/heatmap.ts → fetchYahooStockQuotes(US_HEATMAP_SEEDS)
```

- Target: `livePriceCount >= 5`, `source: live`
- Seeds still provide symbol universe; Yahoo overlays price + change%

### Vietnam Heatmap

```
Primary: VPS adapter (lib/adapters/vietnam/vps-adapter.ts)
Priority: vps → tcbs → vietstock → fireant
Backup:  SSI for future bulk universe expansion
```

- Merges VPS live quotes into VN100 seeds (same pattern as TCBS design)
- VPS works from public internet; validate from Vercel region post-deploy

---

## Twelve Data — Remaining Usage (not removed in Sprint 9)

| Path | Feature | Sprint 10 candidate |
|------|---------|---------------------|
| `lib/twelvedata/client.ts` | Overview quotes | Yahoo/Stooq |
| `lib/twelvedata/ws-relay.ts` | Realtime SSE | Disable or Yahoo poll |
| `app/api/markets/[symbol]` | Symbol detail | Yahoo chart |
| `app/api/realtime/stream` | WS relay | Feature flag off when TD exhausted |

---

## Implementation Summary

| File | Change |
|------|--------|
| `lib/providers/yahoo-finance.ts` | **New** — FX + US stock chart quotes |
| `lib/providers/ecb-fx.ts` | **New** — ECB XML parser + cross-rate derivation |
| `lib/forex/pairs-provider.ts` | Yahoo + ECB; Twelve Data removed |
| `lib/market/heatmap.ts` | US quotes via Yahoo |
| `lib/adapters/vietnam/vps-adapter.ts` | **New** — VPS batch stock quotes |
| `lib/adapters/vietnam/registry.ts` | VPS priority 1 |
| `lib/adapters/vietnam/types.ts` | `VietnamAdapterId` includes `vps` |

---

## Rate Limit & Ops Notes

| Provider | Documented limit | Observed behavior | Mitigation |
|----------|------------------|-------------------|------------|
| Twelve Data | 800 credits/day (free) | 429 after ~10k/day usage | **Removed from Sprint 9 paths** |
| Yahoo v8 | None (unofficial) | 200 OK at 8–10 req/s with 60ms gap | Concurrency caps + heatmap/forex cache TTL |
| ECB | Daily file | Single XML fetch/day sufficient | Cache 1h+ |
| VPS | Undocumented public | 200 OK for 40-symbol batches | `VPS_BATCH_SIZE=40`, 3 batches for VN100 |
| SSI | Undocumented public | 200 OK paginated | Use for listings, not per-tick polling |

---

## Production Verification Checklist (post-deploy)

```bash
# Currency strength — expect pairCount=28, coverage=ideal, unavailable=false
curl -s https://btrading.org/api/currency-strength \
  | jq '{pairCount,coverage,unavailable,items:(.items|length),source}'

# US heatmap — expect livePriceCount>=50, source=live
curl -s https://btrading.org/api/heatmaps/us \
  | jq '{source,itemCount,livePriceCount,seedCount}'

# VN heatmap — expect source=live after VPS adapter
curl -s https://btrading.org/api/heatmaps/vietnam \
  | jq '{source,itemCount,livePriceCount}'

# Health — vietnamMarkets should be ok:true
curl -s https://btrading.org/api/health | jq '.services.vietnamMarkets'
```

### Vercel logs to confirm

```
[provider:yahoo] context=fetchFxPairQuotes requested=28 parsed=28
[provider:forex-pairs] pairCount=28 reason=yahoo
[provider:yahoo] context=fetchStockQuotes requested=100 parsed=...
[provider:vietnam:vps] stocks=... hose=... hnx=... upcom=...
```

---

## Risks & Follow-ups

1. **Yahoo ToS** — Unofficial scraping; ECB backs critical path if Yahoo blocks datacenter IPs.
2. **Vercel cold start** — 100 Yahoo stock fetches ~6–10s; rely on `cachedProvider` heatmap TTL.
3. **VPS geo** — Confirm VPS reachable from Vercel `iad1`; fallback remains mock seeds.
4. **Realtime** — Still Twelve Data WS; consider disabling `features.realtime` until Sprint 10.
5. **Stooq** — Global markets provider still chains Stooq; monitor 404 from production (may work from EU IPs).

---

## Related audits

- `SPRINT8_PROVIDER_FAILURE_AUDIT.md` — Twelve Data 429 + TCBS 404 root cause
- `SPRINT7_PRODUCTION_FIX_AUDIT.md` — Soft coverage tiers + heatmap counts
