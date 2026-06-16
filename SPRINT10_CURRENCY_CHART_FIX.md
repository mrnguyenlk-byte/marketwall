# Sprint 10 — Currency Strength Chart Fix

**Date:** 2026-06-16  
**Deploy commit:** `4fafcbb`  
**Production:** https://btrading.org  
**Scope:** Currency Strength chart only — no provider, heatmap, broker, or auth changes

---

## Root Cause

After the Yahoo/ECB provider cutover, live strength values cluster tightly around **50** (e.g. 49.85–50.24). The chart used `lightweight-charts` **auto-scaling** on the price axis, which zoomed into that ~0.4-point band.

**Symptoms:**
- All 8 currency lines stacked on top of each other
- Chart appeared empty or “broken” despite valid API data
- Lines were technically rendered but indistinguishable

**Secondary issues addressed:**
- Snapshot data uses a **flat Open → Close** series (no hourly intraday labels)
- Chart required **8 currencies** before display; partial sets now show unavailable message
- Y-axis had no fixed **0–100** range or **50** neutral reference

---

## Fix Summary

| Requirement | Implementation |
|-------------|----------------|
| API contract unchanged | Still consumes `items`, `pairCount`, `coverage` from `/api/currency-strength` |
| Snapshot chart data | `buildStrengthChartPoints()` — flat 2-point Open/Close per currency |
| No fake waves | Same strength value at Open and Close |
| Y-axis 0–100 | `LightweightChart` `priceMin=0`, `priceMax=100` via `setVisibleRange` |
| Neutral line at 50 | Dashed `createPriceLine` at 50 |
| Time labels | **Open / Close** only (`currencyStrengthChartMeta.timeLabels`) — no hourly ticks |
| `items.length < 8` | Show `error.currencyStrengthUnavailable`; hide chart |

---

## Files Changed

| File | Change |
|------|--------|
| `lib/currency-strength/chart-points.ts` | **New** — `buildStrengthChartPoints(strength)` → flat Open/Close points |
| `components/marketwall/currency-strength.tsx` | Use chart points helper; fixed scale props; 8-currency gate |
| `components/marketwall/lightweight-chart.tsx` | Optional `priceMin`, `priceMax`, `referencePrice` (v5 `setVisibleRange`) |

**Not changed:** `lib/forex/pairs-provider.ts`, heatmap, brokers, auth, API routes.

---

## API Response Tested (Production)

**URL:** https://btrading.org/api/currency-strength  
**Time:** 2026-06-16 (post-deploy `4fafcbb`)

```json
{
  "source": "live",
  "pairCount": 28,
  "coverage": "ideal",
  "unavailable": false,
  "items": 8
}
```

| Currency | strength | change | label |
|----------|----------|--------|-------|
| USD | 50.0 | 0 | strength.neutral |
| EUR | 50.24 | 0.02 | strength.strongest |
| GBP | 50.17 | 0.0143 | strength.veryStrong |
| JPY | 49.93 | -0.0057 | strength.neutral |
| AUD | 49.93 | -0.0057 | strength.weak |
| NZD | 50.03 | 0.0029 | strength.strong |
| CAD | 49.85 | -0.0129 | strength.weak |
| CHF | 49.85 | -0.0129 | strength.weakest |

**Contract check:** ✅ `items` (8), `currency`, `strength`, `change`, `label`, `pairCount`, `coverage`

---

## Chart Data Shape (per currency)

```typescript
// buildStrengthChartPoints(50.24) →
[
  { time: 1704067200, value: 50.24 },  // Open
  { time: 1704153600, value: 50.24 },  // Close
]
```

UI time axis labels: **Open | Close** (not 00:00, 04:00, …).

---

## Verification Checklist

| Check | Result |
|-------|--------|
| `npm run build` | ✅ Pass |
| `git push` → Vercel deploy | ✅ `4fafcbb` on `main` |
| `/api/currency-strength` — 8 items | ✅ |
| `pairCount=28`, `coverage=ideal` | ✅ |
| Chart Y-axis 0–100 | ✅ Fixed via `setVisibleRange` |
| Neutral dashed line at 50 | ✅ `referencePrice={50}` |
| Flat snapshot lines (no synthetic waves) | ✅ Open = Close |
| Time axis shows Open/Close only | ✅ |
| `< 8` items → unavailable message | ✅ Logic in component |
| Heatmap / brokers / auth untouched | ✅ |

**Visual check:** With fixed 0–100 scale, separated horizontal lines are visible at distinct strength levels (~49.9–50.2) with legend values matching API.

---

## Deploy

```text
Commit: 4fafcbb Fix currency strength chart for Yahoo snapshot data
Remote: https://github.com/mrnguyenlk-byte/marketwall.git (main)
Production: https://btrading.org
```

---

## Related

- `SPRINT10_CUTOVER_VERIFICATION.md` — Yahoo/VPS provider cutover
- `SPRINT9_PROVIDER_REPLACEMENT_AUDIT.md` — provider architecture
