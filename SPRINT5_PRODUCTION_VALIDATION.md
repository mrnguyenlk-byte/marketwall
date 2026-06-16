# Sprint 5 — Production Validation Fix

**Date:** 2026-06-16  
**Scope:** Fix production data regressions on https://btrading.org (currency strength, US/VN heatmaps)  
**Build:** `npm run build` ✅

---

## API Symbol Counts (before deploy fix)

| Endpoint | Production (pre-fix) | Expected | Notes |
|----------|---------------------|----------|-------|
| `/api/currency-strength` | 0 items, `source: live`, `unavailable: true` | 8 currencies | Twelve Data pairs fetched but below 12-pair / 2-per-currency gate |
| `/api/heatmaps/us` | 7 items, `source: mock` | 100 large-cap | Fell back to `mockHeatmapData` (7 mega-caps) when live quotes < 20 |
| `/api/heatmaps/vietnam` | 100 items, `source: mock` | 100 (VN100 seeds) | API count OK; live TCBS adapter (~19 tickers) replaced full seed universe in provider |
| `/api/heatmaps/vn` | (alias → `vietnam`) | 100 | Same as `/api/heatmaps/vietnam` |

Local dev server was unresponsive during validation (hung on upstream Twelve Data calls). Local Twelve Data key hit daily credit limit (800/day exceeded) during diagnosis.

---

## Root Causes

1. **US heatmap mock collapse** — `fetchUsRows()` required ≥20 live Twelve Data quotes; on failure it replaced the entire 100-symbol seed universe with 7-symbol `mockHeatmapData`.
2. **Twelve Data batch / credit limits** — Single batch requests for 28 FX pairs or 50+ equities consumed credits rapidly; 429 errors returned empty arrays, triggering fallbacks.
3. **VN live adapter overwrite** — When TCBS returned ~19 VN30-adjacent tickers, `vietnam-market-provider` replaced the 100-symbol seed buckets instead of overlaying live prices onto seeds.
4. **Currency strength unavailable with live source** — Pairs were attempted via Twelve Data but insufficient coverage after failed/large batches; UI correctly showed “temporarily unavailable” (`unavailable: true`, empty items).
5. **Quote key mismatch** — Batch responses for symbols like `BRK/B` could miss keyed rows when Twelve Data used alternate key formats.

---

## Fixes Applied

| Area | Change | Files |
|------|--------|-------|
| US heatmap universe | Always return 100 configured seeds; overlay live quotes; mock source only when live prices < 5 (never 7-symbol collapse) | `lib/market/heatmap.ts` |
| VN heatmap universe | Merge live TCBS prices into VN100 seed buckets (HOSE/HNX/UPCOM); heatmap API uses seeds + live overlay | `lib/providers/vietnam-market-provider.ts`, `lib/market/heatmap.ts` |
| Twelve Data batching | 8-symbol quote batches, 25-symbol stock batches, pause between batches, partial results on 429 | `lib/twelvedata/client.ts` |
| Forex credit efficiency | Progressive pair fetch — stop when 28-pair snapshot gate passes (~12–16 pairs); 60s in-memory cache | `lib/twelvedata/client.ts` |
| Quote extraction | Multi-variant key lookup for batch quote rows (`BRK/B`, `BRKB`, etc.) | `lib/market/normalize.ts` |
| Server cache TTLs | Forex 60s, heatmap 5m (reduce upstream churn) | `lib/providers/cache.ts` |
| Forex provider chain | Alpha Vantage primary (when `ALPHA_VANTAGE_API_KEY` set), Twelve Data fallback | `lib/forex/pairs-provider.ts`, `lib/alphavantage/client.ts` |

---

## Remaining Twelve Data / Provider Limitations

1. **Free-tier daily credits (800/day)** — Heavy dashboard + SSE + heatmap polling can exhaust credits; batched/progressive fetch and longer cache mitigate but do not remove the cap.
2. **Recommend `ALPHA_VANTAGE_API_KEY` on Vercel** — Provides dedicated forex path for currency strength without Twelve Data credit competition (25 requests/day on free AV tier — cache at 60s essential).
3. **US live prices** — When Twelve Data credits are exhausted, US heatmap returns 100 tiles with seed layout; live price overlay resumes when quotes succeed.
4. **VN realtime** — No VN equity WebSocket; REST/adapters + seed merge only.
5. **Currency strength gates unchanged** — Still requires ≥12 pairs and ≥2 pairs per currency (mathematically required for 8-currency zero-mean model).

---

## Build Result

```
npm run build
✓ Compiled successfully
✓ TypeScript clean
✓ 43 static pages generated
```

---

## Post-Deploy Verification (fill after push)

- [ ] `/api/heatmaps/us` returns **100** items (not 7)
- [ ] `/api/heatmaps/vietnam` returns **100** items with live overlay when TCBS available
- [ ] `/api/currency-strength` returns **8** currencies when forex provider has sufficient pairs
- [ ] https://btrading.org serves latest commit SHA

---

## Related

- `SPRINT5_DATA_REALTIME_AUDIT.md` — Sprint 5 baseline expectations
- `SPRINT5_CURRENCY_STRENGTH_AUDIT.md` — 28-pair strength formula
