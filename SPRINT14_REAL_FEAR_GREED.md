# Sprint 14 — Real Fear & Greed

Replace static / BTC-proxy gauges with composite market indices (Vietnam, US) and the official Alternative.me Crypto Fear & Greed API.

**UI unchanged** — same `FearGreed` component, labels, and gauge rendering.

---

## Architecture

```
buildDashboardData()
  └─ buildFearGreedItems()          lib/providers/fear-greed-provider.ts
        ├─ computeVietnamFearGreed() lib/fear-greed/vietnam.ts
        ├─ computeUsFearGreed()      lib/fear-greed/us.ts
        └─ fetchCryptoFearGreed()    lib/fear-greed/crypto.ts → api.alternative.me
```

Shared helpers: `lib/fear-greed/normalize.ts`, `lib/fear-greed/breadth.ts`, `lib/fear-greed/momentum.ts`

---

## Normalization (all markets)

| Helper | Formula | Use |
|--------|---------|-----|
| `clampScore` | `min(100, max(0, x))` | Final bounds |
| `roundScore` | `round(clampScore(x))` | Integer gauge value |
| `momentumToScore(p, halfRange=10)` | `round(50 + p × (50/halfRange))` | Price momentum % → 0–100 |
| `advanceDeclineScore` | `adv / (adv + dec) × 100` | Names with \|Δ%\| > 0.05 |
| `volumeBreadthScore` | `upVol / (upVol + downVol) × 100` | Volume on up vs down names |
| `foreignFlowScore` | `50 + ((buy−sell)/(buy+sell)) × 50` | Net foreign flow |
| `weightedComposite` | `Σ(score × weight) / Σ(weight)` | Final composite |

**Neutral default:** When a component has no data, score **50** (does not skew composite aggressively).

**Momentum mapping:** −10% → 0, 0% → 50, +10% → 100 (slope **5 points per 1%**).

---

## 1. Vietnam Fear & Greed

### Components & weights

| Component | Weight | Data source |
|-----------|--------|-------------|
| Advance/Decline ratio | **25%** | HOSE + HNX + UPCOM heatmap stocks (`vietnam-market-provider`) |
| Volume breadth | **25%** | Same universe (`volume`, `changePercent`) |
| VNINDEX 20D momentum | **25%** | KBS `index/VNINDEX/data_day` (20 trading-day return) |
| Foreign flow | **25%** | KBS dashboard `topForeignBuy` / `topForeignSell` totals |

### Formulas

```
A/D score     = advancing / (advancing + declining) × 100
                advancing  = count(changePercent > 0.05)
                declining  = count(changePercent < −0.05)

Vol breadth   = Σ volume(up) / (Σ volume(up) + Σ volume(down)) × 100

Momentum score = momentumToScore(VNINDEX_20D_return_%)
                 VNINDEX_20D = (close_t − close_t−20) / close_t−20 × 100

Foreign score  = 50 + netRatio × 50
                 netRatio = (Σ foreignBuy − Σ foreignSell) / (Σ foreignBuy + Σ foreignSell)

FG_vn = round( 0.25×A/D + 0.25×Vol + 0.25×Mom + 0.25×Foreign )
```

### Validation example (illustrative inputs)

| Input | Value |
|-------|-------|
| Advancing / declining | 68 / 42 → **61.8** |
| Up volume / down volume | 62% up → **62** |
| VNINDEX 20D return | **+2.4%** → `50 + 2.4×5` = **62** |
| Foreign buy / sell (top-10 sum) | 9.5B / 6.0B → netRatio 0.23 → **61** |

```
FG_vn = 0.25 × (61.8 + 62 + 62 + 61) = 61.7 → 62
Label: Greed (55–74)
```

---

## 2. US Fear & Greed

### Components & weights

| Component | Weight | Data source |
|-----------|--------|-------------|
| S&P 500 20D momentum | **33.3%** | Yahoo chart `^GSPC`, 20-bar return |
| Market breadth (A/D) | **33.3%** | US heatmap (~100 symbols, Yahoo overlay) |
| Volume breadth | **33.3%** | US heatmap `volume` + `changePercent` |

### Formulas

```
Mom score      = momentumToScore(SPX_20D_return_%)

Breadth score  = advanceDeclineScore(US heatmap items)

Vol score      = volumeBreadthScore(US heatmap items)

FG_us = round( (Mom + Breadth + Vol) / 3 )
```

### Validation example (live snapshot, audit run)

| Input | Value |
|-------|-------|
| S&P 500 20D return | **−0.93%** → `50 + (−0.93×5)` = **45** |
| US heatmap A/D (mock build, flat seeds) | **50** (no clear adv/dec) |
| US volume breadth (mock, zero volume) | **50** |

```
FG_us = round((45 + 50 + 50) / 3) = 48
Label: Fear (25–44) — borderline Neutral at 48
```

With live Yahoo US heatmap during market hours, breadth/volume components reflect real advancers and volume skew.

---

## 3. Crypto Fear & Greed

### Source

**Alternative.me Crypto Fear & Greed Index**

```
GET https://api.alternative.me/fng/?limit=1
```

### Formula

```
FG_crypto = round(clamp(0, 100, response.data[0].value))
```

No local weighting — uses the published composite (volatility, momentum, social, dominance, trends, etc.) from Alternative.me.

`deriveCryptoFearGreed()` (BTC × 4) is **deprecated**.

### Validation example (live snapshot)

```json
{
  "value": "23",
  "value_classification": "Extreme Fear"
}
```

```
FG_crypto = 23
Label: Extreme Fear (< 25)
```

---

## Sentiment labels (unchanged)

Applied client-side via `fgLabel()`:

| Range | Label |
|-------|-------|
| 0–24 | Extreme Fear |
| 25–44 | Fear |
| 45–54 | Neutral |
| 55–74 | Greed |
| 75–100 | Extreme Greed |

---

## Files changed

| File | Change |
|------|--------|
| `lib/fear-greed/normalize.ts` | **New** — clamp, momentum, weighted composite |
| `lib/fear-greed/breadth.ts` | **New** — A/D, volume, foreign flow scores |
| `lib/fear-greed/momentum.ts` | **New** — VNINDEX & S&P 500 20D fetch |
| `lib/fear-greed/vietnam.ts` | **New** — Vietnam composite |
| `lib/fear-greed/us.ts` | **New** — US composite |
| `lib/fear-greed/crypto.ts` | **New** — Alternative.me fetch |
| `lib/providers/fear-greed-provider.ts` | **New** — dashboard builder |
| `lib/providers/build-dashboard-data.ts` | Wire live F&G; fetch US heatmap in parallel |
| `lib/providers/crypto-provider.ts` | Deprecate `deriveCryptoFearGreed` |
| `lib/fear-greed.ts` | Unchanged — types, fallback defaults, `fgLabel` |
| `components/marketwall/fear-greed.tsx` | **Unchanged** |

---

## Fallback behavior

| Scenario | Behavior |
|----------|----------|
| Full pipeline success | Live composites for VN + US + Alternative.me crypto |
| `buildFearGreedItems` throws | Static `fearGreedData` (48 / 71 / 58) |
| Alternative.me unavailable | Crypto falls back to static **71** |
| Component missing data | That component scores **50** |

---

## Build

```
npm run build  → passed
```

---

## Before vs after

| Gauge | Before (Sprint 12 audit) | After (Sprint 14) |
|-------|--------------------------|-------------------|
| Vietnam | Static **48** | 4-factor composite (A/D, vol breadth, VNINDEX 20D, foreign flow) |
| US | Static **58** | S&P 20D momentum + US heatmap breadth + volume breadth |
| Crypto | `50 + BTC_24h × 4` | **Alternative.me** official index |

---

## Notes

1. Vietnam foreign flow uses KBS leaderboard totals (top foreign buy/sell lists), not full-market FOL depth.
2. US breadth uses the same ~100-symbol heatmap universe as the dashboard US tile map.
3. No new API routes — values computed during dashboard SSR in `buildDashboardData()`.
4. Consider exposing `/api/fear-greed` in a future sprint for client refresh without full page reload.
