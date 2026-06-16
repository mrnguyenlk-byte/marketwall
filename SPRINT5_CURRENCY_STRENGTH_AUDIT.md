# Sprint 5 — Currency Strength Audit

**Date:** 2026-06-16  
**Scope:** Fix 28-pair relative strength model, remove VND, stable 1D chart snapshot  
**Build:** `npm run build` ✅

## Summary

Currency strength now derives scores from **28 synchronized FX pairs** (Eight majors: USD, EUR, GBP, JPY, AUD, NZD, CAD, CHF). VND is excluded. Live Twelve Data quotes feed the engine; missing pairs are skipped — no silent mixing of reference/mock prices into live calculations. The chart shows a **flat 1D snapshot** (Open → Close) instead of synthetic intraday waves.

## Algorithm

### Pairs (28)

```
EUR/USD, GBP/USD, AUD/USD, NZD/USD, USD/JPY, USD/CHF, USD/CAD,
EUR/GBP, EUR/JPY, EUR/AUD, EUR/NZD, EUR/CHF, EUR/CAD,
GBP/JPY, GBP/AUD, GBP/NZD, GBP/CHF, GBP/CAD,
AUD/JPY, AUD/NZD, AUD/CHF, AUD/CAD,
NZD/JPY, NZD/CHF, NZD/CAD,
CHF/JPY, CAD/JPY, CAD/CHF
```

### Steps

1. **Fetch** daily `% change` per pair via Twelve Data batch quote (`getForexPairsForCurrencyStrength`).
2. **Contribute** for each pair BASE/QUOTE:
   - `pairChange` = daily % change of BASE vs QUOTE
   - BASE contribution `+= pairChange`
   - QUOTE contribution `-= pairChange`
3. **Average** each currency’s total contribution by its number of pair appearances.
4. **Normalize** (zero-mean across active currencies):
   - `normalizedContribution = (avgContribution − mean) × 12`
   - `score = clamp(50 + normalizedContribution, 0, 100)`
5. Typical daily FX moves keep scores in the **~45–55** band; larger spreads reflect justified pair data.

### Availability gates

| Gate | Threshold |
|------|-----------|
| Minimum pairs used | ≥ 12 of 28 |
| Per-currency coverage | Each of 8 currencies in ≥ 2 pairs |
| Full response | All 8 currency rows present |

Failure → `unavailable: true`, empty `items` (no live/mock blend).

Explicit mock fallback only on API catch path (`source: "mock"`, `unavailable: true`).

## Chart mode

**Snapshot (1D)** — not intraday time series.

- `buildStrengthSeries()` returns a **flat 2-point line** at the current strength (Open / Close).
- No `strengthSeries()` wobble, no hourly fake labels.
- Time axis labels: `Open`, `Close` (UTC).
- Cards + legend still show live strength scores and ranks.

Time-series mode is **not** implemented; would require synchronized `time_series` per pair (future sprint).

## Files changed

| File | Change |
|------|--------|
| `config/market-symbols.ts` | 28 `CURRENCY_STRENGTH_PAIRS` |
| `lib/currency-strength/types.ts` | 8 currencies, 28 pairs, `PAIR_LEGS`, reference quotes, availability constants |
| `lib/currency-strength/calculate-strength.ts` | Zero-mean normalization, flat snapshot series, `isStrengthSnapshotAvailable` |
| `lib/currency-strength/index.ts` | Export `isStrengthSnapshotAvailable` |
| `lib/market/currency-strength.ts` | Live-only inputs; no `REFERENCE_PAIR_QUOTES` fill-in |
| `app/api/currency-strength/route.ts` | Explicit mock fallback on error |
| `lib/currency-strength-mock.ts` | 8 currencies, flat series, Open/Close axis |
| `lib/providers/currency-provider.ts` | 8 mock rows, `buildStrengthSeries` |
| `components/marketwall/currency-strength.tsx` | No VND, `grid-cols-8`, live-only binding, unavailable state |
| `lib/i18n.tsx` | `error.currencyStrengthUnavailable` EN/VI |
| `docs/PROJECT_SPEC.md` | Sprint 5 tracker row |

## API contract (unchanged shape)

`GET /api/currency-strength`

```json
{
  "source": "live" | "mock",
  "items": [{ "currency", "strength", "change", "label" }],
  "unavailable": boolean
}
```

## Verification

- [x] `npm run build`
- [x] VND removed from strength UI and calculation
- [x] 28-pair list matches spec
- [x] No reference-quote injection into live path
- [x] Chart lines are flat (snapshot), not wavy mock intraday

## Follow-ups (out of scope)

- Intraday strength from synchronized `time_series` per pair
- Reduce Twelve Data batch size / quota tuning for 28-pair quote call
- Unit tests for `calculateCurrencyStrength` with partial pair sets
