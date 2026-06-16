# Sprint 18 — Currency Strength Stability Audit

**Date:** 2026-06-16  
**Scope:** Stabilize Currency Strength formula, caching, and UI — no realtime overlay  
**Build:** `npm run build` ✅  

## Summary

Currency Strength now uses a z-score normalization model over 28 FX pairs, with 5-minute server and client refresh windows. Realtime SSE overlay was removed from the client hook. The API exposes cache timing (`updatedAt`, `nextUpdateAt`) and data provider source (`yahoo` / `yahoo+ecb` / `mock`).

## Formula (28-pair relative strength)

For each pair `BASE/QUOTE`:

```
pairReturn = percent change over 1D window
BASE contribution += pairReturn
QUOTE contribution -= pairReturn
```

For each of 8 currencies (`USD`, `EUR`, `GBP`, `JPY`, `AUD`, `NZD`, `CAD`, `CHF` — no VND):

```
rawScore = average(contributions)
mean = average(rawScore across currencies with pair data)
stdDev = population standard deviation(rawScore)
zScore = stdDev > 0 ? (rawScore - mean) / stdDev : 0
strength = clamp(50 + zScore * 10, 0, 100)
```

Implementation: `lib/currency-strength/calculate-strength.ts`

**Behavior:** Typical readings cluster near 50 (40–60 band). Extremes above 70 or below 30 are possible but uncommon — driven by cross-pair dispersion, not arbitrary multipliers.

## Cache TTL

| Layer | TTL | Location |
|-------|-----|----------|
| Server API cache | **5 minutes** (`300_000` ms) | `CACHE_TTL.currencyStrength` in `lib/providers/cache.ts` |
| Client SWR refresh | **5 minutes** | `hooks/useCurrencyStrength.ts` (`refreshInterval`, `dedupingInterval`) |
| Dashboard provider cache | **5 minutes** | `lib/providers/currency-provider.ts` |

Cache metadata helper: `getCacheTiming()` returns `cachedAt` / `expiresAt` for API timestamps.

## Provider

| Role | Source |
|------|--------|
| Primary | Yahoo Finance chart API (1D % change) |
| Fallback | ECB daily euro reference rates (merged for missing pairs) |
| Excluded | Twelve Data, realtime/SSE overlay on client |

## Sample API output

`GET /api/currency-strength` (local, port 3012, 2026-06-16):

```json
{
  "source": "yahoo",
  "items": [
    { "currency": "USD", "strength": 49.02, "change": -0.0014, "label": "strength.neutral" },
    { "currency": "EUR", "strength": 62.95, "change": 0.0186, "label": "strength.strongest" },
    { "currency": "GBP", "strength": 59.95, "change": 0.0143, "label": "strength.veryStrong" },
    { "currency": "JPY", "strength": 32.09, "change": -0.0257, "label": "strength.weakest" },
    { "currency": "AUD", "strength": 50.97, "change": 0.0014, "label": "strength.neutral" },
    { "currency": "NZD", "strength": 59.95, "change": 0.0143, "label": "strength.strong" },
    { "currency": "CAD", "strength": 43.03, "change": -0.01, "label": "strength.weak" },
    { "currency": "CHF", "strength": 42.05, "change": -0.0114, "label": "strength.weak" }
  ],
  "unavailable": false,
  "pairCount": 28,
  "coverage": "ideal",
  "updatedAt": "2026-06-16T11:24:56.156Z",
  "nextUpdateAt": "2026-06-16T11:29:56.156Z",
  "fallback": false
}
```

| Field | Expected |
|-------|----------|
| `items.length` | **8** |
| `pairCount` | **28** (ideal) |
| `coverage` | `ideal` / `valid` / `degraded` |
| `updatedAt` | ISO timestamp of cache write |
| `nextUpdateAt` | `updatedAt` + 5 min |
| `source` | `yahoo`, `yahoo+ecb`, or `mock` |

## Before / after behavior

| Aspect | Before (Sprint 12) | After (Sprint 18) |
|--------|-------------------|-------------------|
| Normalization | `(rawScore - mean) × 12` linear | Z-score × 10 around neutral 50 |
| Typical spread | All currencies ~49–51 (over-compressed) | 40–60 typical; wider when dispersion is real |
| Server cache | 60 s | **5 min** |
| Client refresh | 60 s dedupe + **realtime SSE overlay** | **5 min** SWR only, no realtime overlay |
| API timestamps | `updatedAt` only (always “now”) | `updatedAt` + `nextUpdateAt` from cache window |
| API `source` | `"live"` | `"yahoo"` / `"yahoo+ecb"` / `"mock"` |
| UI footer | None | Last updated + “Updates every 5 minutes” |
| Chart | Horizontal bars (unchanged) | Horizontal bars, sorted strongest → weakest, neutral at 50 |

## Files changed

| File | Change |
|------|--------|
| `lib/currency-strength/calculate-strength.ts` | Z-score formula (`50 + z × 10`) |
| `lib/providers/cache.ts` | `currencyStrength` 5 min TTL; `getCacheTiming()` |
| `lib/forex/pairs-provider.ts` | Return `{ pairs, source }` for API attribution |
| `lib/market/currency-strength.ts` | Propagate yahoo/yahoo+ecb source |
| `app/api/currency-strength/route.ts` | 5 min cache; `updatedAt` / `nextUpdateAt` |
| `lib/api-response.ts` | Preserve payload timestamps; `fallback` when `source === mock` |
| `hooks/useCurrencyStrength.ts` | Remove realtime overlay; 5 min SWR interval |
| `components/marketwall/currency-strength.tsx` | Last updated + cadence footer |
| `lib/i18n.tsx` | `strength.lastUpdated`, `strength.updatesEvery5Min` |
| `lib/providers/currency-provider.ts` | 5 min cache; mock guard for new source values |
| `app/api/realtime/stream/route.ts` | Adapt to pairs provider return shape |

## Verification

### Local build

- [x] `npm run build` passed

### API contract

- [x] `items.length === 8`
- [x] `pairCount`, `coverage`, `updatedAt`, `nextUpdateAt`, `source` present
- [x] Scores stable within 5 min cache window (repeat calls share `updatedAt` and identical strengths)
- [ ] After cache expires, scores may update (manual: wait 5+ min or clear cache)

### UI

- [x] Horizontal strength bars, sorted strongest → weakest
- [x] Neutral marker at 50
- [x] No line chart / no fake intraday series in UI
- [x] Footer: last updated + “Updates every 5 minutes”
- [x] No realtime overlay on Currency Strength

### Production verification checklist

- [ ] Push to `main` and Vercel deploy Ready
- [ ] `GET https://btrading.org/api/currency-strength` returns 8 items + cache timestamps
- [ ] `source` is `yahoo` or `yahoo+ecb` (not Twelve Data)
- [ ] Two requests within 5 min return identical `updatedAt` and scores
- [ ] Dashboard Currency Strength section shows footer cadence text
- [ ] Scores do not flicker on page focus (SWR `revalidateOnFocus: false`)

## Deploy

_Not deployed in this sprint session — run post-sprint deploy workflow when ready._
