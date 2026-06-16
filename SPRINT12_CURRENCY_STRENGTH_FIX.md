# Sprint 12 — Currency Strength Production Fix

## Goal

Fix Currency Strength chart and production display so the module works reliably without a Twelve Data paid plan.

## Root Cause

1. **Broken line chart UX** — The UI rendered a `LightweightChart` with flat 2-point snapshot series (Open → Close at the same value) plus a fake intraday `TimeAxis`. On a fixed 0–100 scale, eight overlapping horizontal lines looked broken and implied intraday movement that does not exist in the data.
2. **Over-aggressive unavailable gate** — `fetchLiveCurrencyStrength()` returned `items: []` when `coverage === "unavailable"` (pairCount &lt; 8), even though strength scores can still be computed for all 8 currencies from partial pair data. The UI then showed “unavailable” despite recoverable data.
3. **ECB fallback only on partial Yahoo** — ECB was fetched only when Yahoo returned fewer than 28 pairs. Running ECB in parallel and merging ensures gaps are filled immediately when Yahoo misses symbols.

Twelve Data was already removed from the forex pairs pipeline in Sprint 9; production API was returning valid live data, but the chart layer undermined trust in the module.

## Changes

| Area | Change |
|------|--------|
| `lib/forex/pairs-provider.ts` | Yahoo + ECB fetched in parallel; Yahoo primary, ECB fills missing pairs |
| `lib/market/currency-strength.ts` | `unavailable` only when `items.length < 8`; always return computed rows |
| `components/marketwall/currency-strength.tsx` | Replaced line chart + time axis with snapshot **strength bars** (0–100, neutral at 50); 8 currency cards retained; coverage badges unchanged |

## Provider

| Role | Source |
|------|--------|
| Primary | Yahoo Finance v8 chart API |
| Fallback | ECB daily euro reference rates (merged for any missing pairs) |
| Excluded | Twelve Data (not used) |

## Verification

### Local (`npm run build` + `next start -p 3011`)

```
GET /api/currency-strength
```

| Field | Value |
|-------|-------|
| `items.length` | **8** |
| `pairCount` | **28** |
| `coverage` | **ideal** |
| `unavailable` | **false** |
| `source` | **live** |

Currencies: USD, EUR, GBP, JPY, AUD, NZD, CAD, CHF.

### Production (pre-deploy baseline)

```
GET https://btrading.org/api/currency-strength
```

| Field | Value |
|-------|-------|
| `items.length` | **8** |
| `pairCount` | **28** |
| `coverage` | **ideal** |
| `unavailable` | **false** |
| `source` | **live** |

## Chart Mode

**Snapshot bars + cards** (no line chart)

- Top row: 8 toggleable currency cards with strength score and rank label
- Below: horizontal bars on a **0–100** scale with **neutral marker at 50**
- No synthetic intraday waves, no `TimeAxis`, no `LightweightChart`

## UI Coverage Behavior

| `coverage` | Display |
|------------|---------|
| `ideal` | Normal (no badge) |
| `valid` | Badge: “Partial data” |
| `degraded` | Badge: “Limited coverage” |
| Unavailable message | Only when `items.length < 8` |

## Build

```
npm run build
```

Result: **passed** (Next.js 16.2.6, TypeScript clean).

## Deploy

```
git add .
git commit -m "Fix currency strength production display"
git push origin main
```

## Scope Respected

- No UI redesign beyond chart representation fix
- No new features
- Brokers, auth, and Vietnam dashboard untouched
- Currency Strength module only
