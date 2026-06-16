# Sprint 19 — Production Readiness Audit

**Date:** 2026-06-16  
**Scope:** Pre–public beta audit fixes (VN heatmap sizing, FX UX, foreign flow integrity)  
**Production:** https://btrading.org

---

## 1. Vietnam Heatmap Sizing Audit

### Current sizing mode

| Market | Default sizing | Sort key | Tile color |
|--------|----------------|----------|------------|
| **Vietnam** | `tradingValue` | Largest `price × volume` first | Daily `% change` |
| US | `marketCap` (unchanged) | Market cap | Daily `% change` |
| Crypto | `marketCap` (unchanged) | Market cap | Daily `% change` |

**Code references:**
- `lib/vietnam/heatmap-sizing.ts` — `DEFAULT_VN_HEATMAP_SIZING = "tradingValue"`
- `components/heatmap/MarketHeatmap.tsx` — `sortBySizeMetric()` + `data-sizing={vnSizing}`
- `components/marketwall/heatmap.tsx` — sizing toggle (Trading Value / Volume / Market Cap), VN only

### Formula

```
tradingValue = price × volume   (VND)
tile tier (large → tiny) = rank after sortBySizeMetric descending
tile color = changePercent (gain/loss/neutral)
```

User can switch to `volume` or `marketCap` via UI toggle; **default remains Trading Value**.

### Audit result: **PASS — no code change required**

Sizing already matches Sprint 16 spec. Production data confirms trading value drives ranking, not market cap:

| Rank by trading value (prod 2026-06-16) | Symbol | price × volume |
|----------------------------------------|--------|----------------|
| 1 | VE4 | 1,066,000,000,000 |
| 2 | QST | 150,800,000,000 |
| 3 | VIX | 75,424,624,000 |
| 4 | VCR | 72,200,000,000 |
| 5 | SHB | 66,519,840,000 |

| Rank by market cap (different order) | VCB, VIC, VHM, BID, CTG |

Large tiles correspond to highest **trading value**, not highest market cap.

### Screenshot proof

_Add after deploy — verify in browser:_
1. VN heatmap with **Trading Value** toggle active (default)
2. Largest tiles = VE4 / QST / VIX class symbols (high GTGD), not only VCB/VIC
3. `data-sizing="tradingValue"` on heatmap grid in DevTools

---

## 2. Currency Strength UX Audit

### Before Sprint 19

| Field | Shown? |
|-------|--------|
| Last updated | Partial (date+time string) |
| Next update | ❌ |
| Source | ❌ |
| Coverage | Badge only when degraded/partial |
| Updates every 5 min | ✅ (inline) |

### After Sprint 19

Footer on `components/marketwall/currency-strength.tsx`:

```
Source: Yahoo Finance · Coverage: ideal
Updated: HH:mm · Next update: HH:mm · Refresh cadence: 5 min
```

Formula unchanged (z-score model from Sprint 18).

### Production sample (2026-06-16)

```json
{
  "source": "yahoo",
  "fallback": false,
  "unavailable": false,
  "pairCount": 28,
  "coverage": "ideal",
  "items": 8,
  "updatedAt": "2026-06-16T11:44:10.859Z",
  "nextUpdateAt": "2026-06-16T11:49:10.859Z"
}
```

Scores: EUR 61.1, JPY 28.6, others ~44–60 (stable within 5-min window).

### Audit result: **FIXED**

---

## 3. Foreign Flow Integrity Audit

### Before

`foreign-flow-chart.tsx` exposed **1d / 7d / 30d** periods.  
7D/30D used `scaledShares(shares × days)` — **estimated history**, not real data.

`vietnam-market-analytics.tsx` showed disabled 7D/28D buttons.

### After Sprint 19

| Location | Change |
|----------|--------|
| `foreign-flow-chart.tsx` | **Today only** badge; period selector removed; always `1d` |
| `vietnam-market-analytics.tsx` | Today badge + tooltip; 7D/28D buttons removed |
| Footer estimate text | Removed `foreignFlow.periodEstimate` |

Tooltip (when historical unavailable):

> Historical foreign-flow data not available from current free providers.

### Audit result: **FIXED** — no estimated multi-day foreign flow displayed as history

---

## 4. Production Endpoint Audit

**Run:** 2026-06-16 against https://btrading.org

### `/api/currency-strength`

| Check | Result |
|-------|--------|
| `source` | `yahoo` ✅ |
| `fallback` | `false` ✅ |
| `unavailable` | `false` ✅ |
| `items.length` | `8` ✅ |
| `pairCount` | `28` ✅ |
| `coverage` | `ideal` ✅ |
| `updatedAt` / `nextUpdateAt` | Present ✅ |

### `/api/heatmaps/vietnam`

| Check | Result |
|-------|--------|
| `source` | `live` ✅ |
| `fallback` | `false` ✅ |
| `unavailable` | `false` ✅ |
| `items.length` | `147` ✅ |
| VPS/KBS quotes | price, volume, changePercent present ✅ |

### `/api/vietnam-markets`

| Check | Result |
|-------|--------|
| `source` | `live` ✅ |
| `fallback` | `false` ✅ |
| `analytics.breadth.available` | `true` ✅ |
| `analytics.foreignFlow.available` | `true` ✅ |
| `analytics.proprietary.available` | `false` ✅ (expected — no free provider) |

### Provider chain

| Endpoint | Primary | Status |
|----------|---------|--------|
| VN heatmap | VPS → KBS → TCBS | **Live** on production |
| VN markets | VPS + KBS enrichment | **Live** |
| FX strength | Yahoo (+ ECB fallback) | **Live**, 28 pairs |

**No mock data** on audited VN/FX endpoints at time of check.

---

## 5. Remaining Blockers

| Blocker | Severity | Notes |
|---------|----------|-------|
| US heatmap Yahoo intermittent | Medium | `/api/heatmaps/us` can fall back when Yahoo returns 0 quotes; out of Sprint 19 scope |
| Proprietary (tự doanh) data | Low | Empty state by design — no free provider |
| Intraday VN liquidity curve | Low | Snapshot mode only — documented in Sprint 17 |
| Foreign flow 7D/28D history | Low | **Resolved** — removed estimated periods |
| Screenshot assets for audit doc | Low | Manual browser capture post-deploy |

**No P0 blockers** for Vietnam market or currency strength public beta.

---

## 6. Public Beta Readiness Score

| Area | Weight | Score | Notes |
|------|--------|-------|-------|
| VN heatmap (live + sizing) | 25% | **24/25** | Trading value default verified |
| VN dashboard + analytics | 25% | **23/25** | Live breadth/foreign; proprietary N/A |
| Currency strength | 20% | **20/20** | Stable, full metadata footer |
| Foreign flow integrity | 15% | **15/15** | Today only, no fake history |
| API reliability (VN/FX) | 15% | **14/15** | All green; US market separate |

### **Overall: 96 / 100 — Ready for public beta** (VN-focused dashboard)

Recommendation: ship beta with Vietnam + FX as primary live surfaces; label US heatmap “delayed sample data” if Yahoo fails until Sprint 20 hardening.

---

## Files changed (Sprint 19)

| File | Change |
|------|--------|
| `components/marketwall/currency-strength.tsx` | Full metadata footer |
| `components/marketwall/foreign-flow-chart.tsx` | Today only; remove 7d/30d |
| `components/marketwall/vietnam-market-analytics.tsx` | Today only foreign tab |
| `lib/i18n.tsx` | Footer + foreign flow strings |
| `SPRINT19_PRODUCTION_READINESS.md` | This document |

**Not modified:** US/crypto heatmaps, brokers, auth, VN dashboard tables, FX formula.

---

## Verification checklist

- [x] VN default sizing = Trading Value (`price × volume`)
- [x] Production top tiles ≠ market-cap order
- [x] Currency strength footer shows source, coverage, updated, next update, cadence
- [x] Foreign flow: no 7D/30D estimated periods
- [x] Production APIs: no mock/fallback on VN/FX audit
- [x] `npm run build` passed
- [ ] Deploy commit + production HTML footer check (post-push)
- [ ] Screenshot proof for heatmap sizing (manual)
