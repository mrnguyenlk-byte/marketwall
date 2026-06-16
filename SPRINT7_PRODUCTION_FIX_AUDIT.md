# Sprint 7 — Production Data Validation Fixes Audit

**Date:** 2026-06-16  
**Scope:** Soft currency-strength coverage tiers, heatmap symbol-count guarantees, production mock audit  
**Build:** `npm run build` ✅

---

## Summary

Sprint 7 aligns production behavior with Sprint 5 claims without new providers, APIs, or UI redesign:

1. **Currency strength** — Replaced strict ≥12-pair + ≥2-pairs-per-currency gate with soft coverage tiers. Partial Twelve Data batches (8–27 pairs) now display with warning badges instead of "temporarily unavailable."
2. **US heatmap** — Confirmed 100-symbol seed universe always returned; added logging, metadata, and 50-symbol minimum padding safety net.
3. **VN heatmap** — Confirmed VN100 (100 seeds); added logging and metadata fields on API responses.
4. **Mock audit** — Documented active vs fallback mock paths across production code.

---

## Currency Strength — Pair Count Tiers

| Pair count | `coverage` | Display | Badge |
|------------|------------|---------|-------|
| 28 | `ideal` | ✅ 8 currencies | — |
| 12–27 | `valid` | ✅ 8 currencies | "Partial data" |
| 8–11 | `degraded` | ✅ 8 currencies | "Limited coverage" |
| < 8 | `unavailable` | ❌ hidden | "Temporarily unavailable" |

**Removed:** Requirement that all 8 currencies must appear in ≥2 pairs when total pair count meets degraded threshold.

**Server log:** `[currency-strength] pairs=${pairCount} coverage=${coverage}` in `lib/market/currency-strength.ts`.

**API fields (additive):** `pairCount`, `coverage` on `/api/currency-strength`.

---

## US Heatmap Symbol Counts

| Metric | Expected | Code path |
|--------|----------|-----------|
| Seed universe | **100** | `config/heatmap-symbols.ts` → `US_HEATMAP_SEEDS` |
| Minimum tiles | **50** | `ensureMinHeatmapRows()` pads from seeds if needed |
| Live overlay | Twelve Data `getStockQuotes()` | Overlays onto seeds; never swaps to 7-symbol mock |
| `source: live` | ≥5 live prices | `US_LIVE_MIN_PRICES = 5` |

**Server log:** `[heatmap:us] items=${rows.length} livePrices=${liveCount}` in `lib/market/heatmap.ts`.

**API fields (additive):** `itemCount`, `livePriceCount`, `seedCount` on `/api/heatmaps/us`.

**7-symbol mock:** `lib/mockHeatmapData.ts` `US_ASSETS` (7 mega-caps) — **not used** by `fetchUsRows()`; crypto fallback only via `mockAssetsToRows("crypto")`.

---

## VN Heatmap Symbol Counts

| Metric | Expected | Code path |
|--------|----------|-----------|
| Seed universe | **100** | `lib/vietnam-heatmap-seeds.ts` (HOSE + HNX + UPCOM) |
| API cap | **100** | `VN_HEATMAP_SIZE = 100` in `lib/market/heatmap.ts` |
| Live overlay | TCBS adapters → merge into seeds | `vietnam-market-provider.ts` `mergeHeatmapStockBucket()` |

**Server log:** `[heatmap:vn] items=${rows.length} livePrices=${liveCount}` in `lib/market/heatmap.ts`.

**API fields (additive):** `itemCount`, `livePriceCount`, `seedCount` on `/api/heatmaps/vn` (alias `/api/heatmaps/vietnam`).

---

## Files Changed

| File | Change |
|------|--------|
| `lib/currency-strength/types.ts` | `StrengthCoverage` type; tier constants (`IDEAL` 28, `VALID` 12, `DEGRADED` 8) |
| `lib/currency-strength/calculate-strength.ts` | `resolveStrengthCoverage()`; soft `isStrengthSnapshotAvailable()` |
| `lib/currency-strength/index.ts` | Export new type + function |
| `lib/market/currency-strength.ts` | Soft tiers, logging, `pairCount`/`coverage` metadata |
| `app/api/currency-strength/route.ts` | Pass through `pairCount`, `coverage` |
| `hooks/useCurrencyStrength.ts` | Response types for `pairCount`, `coverage` |
| `components/marketwall/currency-strength.tsx` | Fail-soft display; coverage warning badges |
| `lib/i18n.tsx` | `strength.coveragePartial`, `strength.coverageDegraded` |
| `lib/market/heatmap.ts` | Logging, metadata, US min-50 padding, VN100 guarantee |
| `app/api/heatmaps/[market]/route.ts` | Pass through heatmap metadata fields |

---

## Remaining Mock Data — Active vs Fallback

### Active mock (intentional production paths)

| Location | Trigger | Purpose |
|----------|---------|---------|
| `components/marketwall/currency-strength.tsx` | `features.liveClientFetch === false` | Static demo via `lib/currency-strength-mock.ts` |
| `lib/market/overview.ts` | Per-symbol merge when live quote missing | `buildMockQuotes()` fills gaps in overview |
| `lib/market/heatmap.ts` `fetchVietnamRows()` | Base tile layout | VN100 seeds from `getVietnamMock()` before live overlay |
| `lib/providers/vietnam-market-provider.ts` | Adapter failure / disabled | Full VN market mock with 100 seed stocks |
| `lib/providers/news-provider.ts` | RSS/API failure | Mock news items |
| `lib/providers/economic-provider.ts` | Calendar API failure | Mock economic events |
| `lib/symbol-detail.ts` | Symbol detail modal | Static `mockPrice` per symbol registry |
| `components/marketwall/symbol-detail-modal.tsx` | Detail modal open | Reads `symbol-detail.ts` mock prices |

### Fallback mock (error / insufficient live only)

| Location | Trigger | Notes |
|----------|---------|-------|
| `lib/market/currency-strength.ts` `fetchMockCurrencyStrength()` | API route catch block | Returns mock rows + `unavailable: true` |
| `lib/market/heatmap.ts` `mockAssetsToRows("crypto")` | Crypto provider double-failure | Last-resort crypto tiles |
| `lib/market/heatmap.ts` US/VN paths | Live overlay fails | **Keeps full seed universe** — `source: mock`, not collapsed |
| `lib/providers/*` via `withFallback()` | Upstream errors | Global, crypto, Vietnam, news, economic providers |
| `lib/mockHeatmapData.ts` | Crypto fallback only (US path removed) | US has 7 assets; **not** used for US heatmap API |
| `lib/providers/heatmap-provider.ts` | Legacy dashboard builder | 18 US tiles, ~60 VN tiles in old heatmap mock |
| `lib/currency-strength/types.ts` `REFERENCE_PAIR_QUOTES` | `calculateReferenceStrength()` | Explicit offline reference (not production path) |

### Not production (dev / disabled features)

| Location | Notes |
|----------|-------|
| `lib/dashboard-section-mocks.ts` | Dashboard section placeholders |
| `lib/currency-strength-mock.ts` | UI fallback when live fetch disabled |
| `lib/providers/build-dashboard-data.ts` | Legacy dashboard assembly |

---

## Production Verification Checklist

Run against https://btrading.org after deploy:

```bash
# Currency strength — expect items.length === 8 when pairCount >= 8
curl -s https://btrading.org/api/currency-strength | jq '{items: (.items|length), pairCount, coverage, unavailable, source}'

# US heatmap — expect itemCount >= 50 (target 100), seedCount 100
curl -s https://btrading.org/api/heatmaps/us | jq '{itemCount, livePriceCount, seedCount, source, unavailable, items: (.items|length)}'

# VN heatmap — expect itemCount 100, seedCount 100
curl -s https://btrading.org/api/heatmaps/vn | jq '{itemCount, livePriceCount, seedCount, source, unavailable, items: (.items|length)}'

# VN alias
curl -s https://btrading.org/api/heatmaps/vietnam | jq '{itemCount, seedCount, items: (.items|length)}'
```

### Expected post-fix behavior

- [ ] `/api/currency-strength` returns **8 items** when `pairCount >= 8` (even if `coverage` is `valid` or `degraded`)
- [ ] `/api/currency-strength` includes `pairCount` and `coverage` fields
- [ ] UI shows strength chart with warning badge when `coverage` is `valid` or `degraded`
- [ ] UI shows "temporarily unavailable" only when `items` empty or `coverage === "unavailable"`
- [ ] `/api/heatmaps/us` returns **100 items** (never 7)
- [ ] `/api/heatmaps/us` includes `itemCount`, `livePriceCount`, `seedCount`
- [ ] `/api/heatmaps/vn` returns **100 items**
- [ ] Server logs show `[currency-strength]` and `[heatmap:us|vn]` pair/symbol counts

---

## Build Result

```
npm run build
✓ Compiled successfully
✓ TypeScript clean
✓ 43 static pages generated
```

---

## Related

- `SPRINT5_DATA_REALTIME_AUDIT.md` — Sprint 5 baseline (28-pair model, 100-tile heatmaps)
- `SPRINT5_PRODUCTION_VALIDATION.md` — Pre-fix production diagnosis (7-symbol US collapse, strict strength gates)
- `SPRINT5_CURRENCY_STRENGTH_AUDIT.md` — Strength formula details
